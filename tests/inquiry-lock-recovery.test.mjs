import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { withInquiryLock } from '../lib/inquiry-store.mjs';

const old = new Date(Date.now() - 10 * 60 * 1000).toISOString();
const shortWait = { timeoutMs: 70, pollMs: 5 };

async function fixture(t, owner) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'yurim-lock-recovery-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lockPath = path.join(dir, '.inquiries.lock');
  await writeFile(lockPath, typeof owner === 'string' ? owner : JSON.stringify(owner));
  return { dir, lockPath };
}

test('an old lock whose owner no longer exists is recovered', async (t) => {
  const { dir, lockPath } = await fixture(t, { pid: 2147483647, startedAt: old });
  assert.equal(await withInquiryLock(dir, async () => {
    const owner = JSON.parse(await readFile(lockPath, 'utf8'));
    assert.equal(owner.pid, process.pid);
    assert.ok(owner.lockId);
    assert.ok(owner.processStartedAt);
    return 'recovered';
  }, shortWait), 'recovered');
});

test('a legacy lock from the previous incarnation of the same PID is recovered', async (t) => {
  const { dir } = await fixture(t, { pid: process.pid, startedAt: '2000-01-01T00:00:00.000Z' });
  assert.equal(await withInquiryLock(dir, () => true, shortWait), true);
});

test('a Linux lock with reused PID and different process start ticks is recovered', { skip: process.platform !== 'linux' }, async (t) => {
  const boot = readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  const { dir } = await fixture(t, { pid: process.pid, startedAt: old, processIncarnation: `${boot}:0` });
  assert.equal(await withInquiryLock(dir, () => true, shortWait), true);
});

test('a live owner keeps its lock, including an old lock with matching Linux incarnation', async (t) => {
  let incarnation;
  if (process.platform === 'linux') {
    const boot = readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
    const details = readFileSync(`/proc/${process.pid}/stat`, 'utf8');
    incarnation = `${boot}:${details.slice(details.lastIndexOf(')') + 1).trim().split(/\s+/)[19]}`;
  }
  const owner = { pid: process.pid, startedAt: incarnation ? old : new Date().toISOString(), ...(incarnation ? { processIncarnation: incarnation } : {}) };
  const { dir, lockPath } = await fixture(t, owner);
  const contents = await readFile(lockPath, 'utf8');
  await assert.rejects(withInquiryLock(dir, () => assert.fail('live lock entered'), shortWait), { code: 'STORE_BUSY' });
  assert.equal(await readFile(lockPath, 'utf8'), contents);
});

test('recent abandoned locks and unreadable ownership records remain untouched', async (t) => {
  for (const owner of [{ pid: 2147483647, startedAt: new Date().toISOString() }, '{invalid json', { pid: 'unknown', startedAt: old }]) {
    const { dir, lockPath } = await fixture(t, owner);
    const contents = await readFile(lockPath, 'utf8');
    await assert.rejects(withInquiryLock(dir, () => assert.fail('uncertain lock entered'), shortWait), { code: 'STORE_BUSY' });
    assert.equal(await readFile(lockPath, 'utf8'), contents);
  }
});

test('simultaneous callers recover one abandoned lock and preserve exclusive entry', async (t) => {
  const { dir } = await fixture(t, { pid: 2147483647, startedAt: old });
  let active = 0;
  let peak = 0;
  let entered = 0;
  await Promise.all(Array.from({ length: 5 }, () => withInquiryLock(dir, async () => {
    active++;
    peak = Math.max(peak, active);
    entered++;
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
  }, { timeoutMs: 1000, pollMs: 5 })));
  assert.equal(entered, 5);
  assert.equal(peak, 1);
});
