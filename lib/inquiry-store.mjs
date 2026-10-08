import { open, mkdir, readFile, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Cooperating server/CLI processes share this exclusive lock. Never remove a live lock. */
export async function withInquiryLock(dataDir, operation) {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const lockPath = path.join(dataDir, '.inquiries.lock');
  const deadline = Date.now() + 5_000;
  let handle;
  while (!handle) {
    try {
      handle = await open(lockPath, 'wx', 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    } catch (error) {
      if (handle) { await handle.close(); await unlink(lockPath).catch(() => {}); throw error; }
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw Object.assign(new Error('문의 저장소가 사용 중입니다. 진행 중인 작업 또는 저장소 잠금을 확인해 주세요.'), { status: 503, code: 'STORE_BUSY' });
      await wait(40);
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
