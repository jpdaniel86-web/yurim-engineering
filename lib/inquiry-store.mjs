import { open, mkdir, readFile, rename, stat, unlink } from 'node:fs/promises';
import { lstatSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const PROCESS_STARTED_AT = Date.now() - process.uptime() * 1000;
const ABANDONED_LOCK_GRACE_MS = 2 * 60 * 1000;

function processIncarnation(pid) {
  if (process.platform !== 'linux') return undefined;
  try {
    const boot = readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
    const details = readFileSync(`/proc/${pid}/stat`, 'utf8');
    const startTicks = details.slice(details.lastIndexOf(')') + 1).trim().split(/\s+/)[19];
    return /^\d+$/.test(startTicks) ? `${boot}:${startTicks}` : undefined;
  } catch { return undefined; }
}

const PROCESS_INCARNATION = processIncarnation(process.pid);

function abandonedOwner(owner) {
  if (!Number.isInteger(owner.pid) || owner.pid < 1 || owner.pid > 2147483647) return false;
  try { process.kill(owner.pid, 0); }
  catch (error) { return error.code === 'ESRCH'; }
  if (owner.processIncarnation) {
    if (!/^[0-9a-f-]{36}:\d+$/i.test(owner.processIncarnation)) return false;
    const current = processIncarnation(owner.pid);
    return Boolean(current && current !== owner.processIncarnation);
  }
  // Legacy lock files have no Linux incarnation. PID 1 is often reused by a
  // new container: only our own process start proves that older owner is gone.
  return owner.pid === process.pid && Date.parse(owner.startedAt) < PROCESS_STARTED_AT - 2000;
}

/** Single-process recovery: no await lets another server request replace the
 * checked lock before removal. Unreadable, recent and live locks stay intact. */
function recoverAbandonedLock(lockPath) {
  try {
    const before = lstatSync(lockPath);
    if (!before.isFile() || before.size < 1 || before.size > 2048) return false;
    const contents = readFileSync(lockPath, 'utf8');
    const owner = JSON.parse(contents);
    const startedAt = Date.parse(owner?.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < ABANDONED_LOCK_GRACE_MS || !abandonedOwner(owner)) return false;
    const after = lstatSync(lockPath);
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || readFileSync(lockPath, 'utf8') !== contents) return false;
    if (!abandonedOwner(owner)) return false;
    unlinkSync(lockPath);
    return true;
  } catch { return false; }
}

/** Cooperating server/CLI processes share this exclusive lock. Never remove a live lock. */
export async function withInquiryLock(dataDir, operation, { timeoutMs = 5000, pollMs = 40 } = {}) {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const lockPath = path.join(dataDir, '.inquiries.lock');
  const deadline = Date.now() + timeoutMs;
  let handle;
  while (!handle) {
    try {
      handle = await open(lockPath, 'wx', 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), processStartedAt: new Date(PROCESS_STARTED_AT).toISOString(), ...(PROCESS_INCARNATION ? { processIncarnation: PROCESS_INCARNATION } : {}), lockId: randomUUID() }));
    } catch (error) {
      if (handle) { await handle.close(); await unlink(lockPath).catch(() => {}); throw error; }
      // Windows may report EPERM while a just-unlinked file is still pending
      // deletion. Treat only that platform-specific open race as contention.
      const pendingWindowsDelete = process.platform === 'win32' && error.code === 'EPERM';
      if (error.code !== 'EEXIST' && !pendingWindowsDelete) throw error;
      if (error.code === 'EEXIST' && recoverAbandonedLock(lockPath)) continue;
      if (Date.now() >= deadline) throw Object.assign(new Error('문의 저장소가 사용 중입니다. 진행 중인 작업 또는 저장소 잠금을 확인해 주세요.'), { status: 503, code: 'STORE_BUSY' });
      await wait(pollMs);
    }
  }
  try { return await operation(path.join(dataDir, 'inquiries.jsonl')); }
  finally { await handle.close(); await unlink(lockPath); }
}

export async function readInquiryFile(storePath, maxBytes = 128 * 1024 * 1024) {
  try {
    const info = await stat(storePath);
    if (info.size > maxBytes) throw Object.assign(new Error('문의 파일이 조회 한도를 넘었습니다. 서버에서 직접 관리해 주세요.'), { status: 503, code: 'STORE_TOO_LARGE' });
    const contents = await readFile(storePath, 'utf8');
    return contents.split('\n').filter(Boolean).map((line) => {
      const item = JSON.parse(line);
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.receivedAt !== 'string') throw new Error('Invalid inquiry record');
      return item;
    });
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

export async function appendInquiry(dataDir, record) {
  return withInquiryLock(dataDir, async (storePath) => {
    const handle = await open(storePath, 'a', 0o600);
    try { await handle.writeFile(`${JSON.stringify(record)}\n`, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
  });
}

/** Whole-file replacement under the shared lock prevents lost concurrent submissions. */
export async function updateInquiries(dataDir, transform) {
  return withInquiryLock(dataDir, async (storePath) => {
    const current = await readInquiryFile(storePath);
    const { records, result } = await transform(current);
    const temporary = `${storePath}.${randomUUID()}.tmp`;
    let handle;
    try {
      handle = await open(temporary, 'wx', 0o600);
      await handle.writeFile(records.map((item) => JSON.stringify(item)).join('\n') + (records.length ? '\n' : ''), 'utf8');
      await handle.sync();
      await handle.close();
      handle = undefined;
      await rename(temporary, storePath);
      return result;
    } finally {
      if (handle) await handle.close();
      await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    }
  });
}
