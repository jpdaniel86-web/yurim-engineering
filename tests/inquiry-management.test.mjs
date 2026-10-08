import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { appendInquiry, readInquiryFile, withInquiryLock } from '../lib/inquiry-store.mjs';
import { csvCell, run, selectExpired } from '../scripts/manage-inquiries.mjs';

async function dataFixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'yurim-inquiry-management-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const record = { id: randomUUID(), receivedAt: '2024-01-01T00:00:00.000Z', type: 'iot', name: '홍길동', company: '=cmd()', phone: '+821012345678', message: '현장 상담을 요청드립니다.', consent: true };
  await appendInquiry(dir, record);
  return { dir, record };
}

test('CSV protects formula-like fields and correctly quotes embedded text', () => {
  for (const input of ['=cmd()', '+821012345678', '-1+1', '@SUM(A1:A2)', '  =2+3', '\tcmd']) assert.match(csvCell(input), /^"'/);
  assert.equal(csvCell('"자료", 회사'), '"""자료"", 회사"');
  assert.equal(csvCell('일반 내용'), '"일반 내용"');
});

test('retention keeps pending inquiries by default and uses completed time', () => {
  const now = Date.parse('2026-10-08T00:00:00Z');
  const records = [
    { id: 'pending', receivedAt: '2020-01-01T00:00:00Z' },
    { id: 'expired', receivedAt: '2020-01-01T00:00:00Z', completedAt: '2025-01-01T00:00:00Z' },
    { id: 'recent', receivedAt: '2020-01-01T00:00:00Z', completedAt: '2026-09-01T00:00:00Z' },
  ];
  assert.deepEqual(selectExpired(records, { now }).map((item) => item.id), ['expired']);
  assert.equal(selectExpired(records, { now, receivedDays: 365 }).length, 3);
});

test('operator CLI exports privately, completes an inquiry, previews/prunes and deletes by id', async (t) => {
  const { dir, record } = await dataFixture(t);
  const output = [];
  const log = (text) => output.push(text);
  await run(['list', '--json', '--data-dir', dir], log);
  assert.ok(!output.join('').includes(record.phone));
  const exported = path.join(dir, 'private-export.csv');
  await run(['export', '--out', exported, '--data-dir', dir], log);
  assert.match(await readFile(exported, 'utf8'), /"'=cmd\(\)"/);
  await assert.rejects(run(['export', '--out', exported, '--data-dir', dir], log), { code: 'EEXIST' });
  await run(['complete', record.id, '--at', '2025-01-01T00:00:00Z', '--data-dir', dir], log);
  await run(['prune', '--data-dir', dir], log);
  assert.equal((await withInquiryLock(dir, readInquiryFile)).length, 1);
  await run(['prune', '--completed-days', '1', '--apply', '--data-dir', dir], log);
  assert.equal((await withInquiryLock(dir, readInquiryFile)).length, 0);
  await appendInquiry(dir, record);
  await run(['delete', record.id, '--data-dir', dir], log);
  assert.equal((await withInquiryLock(dir, readInquiryFile)).length, 0);
});

test('simultaneous storage writers preserve complete records while operator completion runs', async (t) => {
  const { dir, record } = await dataFixture(t);
  await Promise.all([
    ...Array.from({ length: 8 }, () => appendInquiry(dir, { ...record, id: randomUUID() })),
    run(['complete', record.id, '--data-dir', dir], () => {}),
  ]);
  const records = await withInquiryLock(dir, readInquiryFile);
  assert.equal(records.length, 9);
  assert.equal(new Set(records.map((item) => item.id)).size, 9);
  assert.ok(records.find((item) => item.id === record.id).completedAt);
});
