import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server.mjs';
import { appendInquiry, readInquiryFile, withInquiryLock } from '../lib/inquiry-store.mjs';
import { createInquiryMailer, formSubmitPayload, submitToFormSubmit, validateEmailDestination } from '../lib/inquiry-email.mjs';

const record = () => ({ id: randomUUID(), receivedAt: '2026-10-08T00:00:00Z', type: 'iot', name: '테스트 문의', company: '테스트 회사', phone: '010-1234-5678', message: '가상의 테스트 시설에 대한 문의입니다.', consent: true });
const acceptedResponse = () => new Response(JSON.stringify({ success: 'true', message: 'Form submitted successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

async function dirFixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'yurim-email-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('FormSubmit payload contains approved contact fields and fixed control settings', () => {
  const item = { ...record(), _cc: 'attacker@example.test' };
  const payload = formSubmitPayload(item, 'https://yurim.example.test');
  assert.equal(payload['연락처'], item.phone);
  assert.equal(payload['문의분야'], 'IoT 서비스 문의');
  assert.equal(payload._url, 'https://yurim.example.test/contact/iot');
  assert.equal(payload._captcha, 'false');
  assert.ok(!('_cc' in payload));
  assert.match(payload._subject, new RegExp(item.id));
  assert.throws(() => validateEmailDestination('one@example.test,two@example.test'));
  assert.throws(() => validateEmailDestination('one@example.test\r\nInjected: value'));
});

test('provider JSON acceptance stays distinct from activation and mailbox delivery', async () => {
  const requests = [];
  const options = { emailTo: 'recipient@example.test', siteUrl: 'https://yurim.example.test', fetchImpl: async (url, init) => { requests.push({ url, init }); return acceptedResponse(); } };
  const result = await submitToFormSubmit(record(), options);
  assert.equal(result.status, 'accepted');
  assert.equal(result.deliveryConfirmed, false);
  assert.equal(requests[0].url, 'https://formsubmit.co/ajax/recipient%40example.test');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.redirect, 'error');
  const activation = await submitToFormSubmit(record(), { ...options, fetchImpl: async () => new Response(JSON.stringify({ success: true, message: 'Please activate your form by confirming your email' }), { status: 200 }) });
  assert.equal(activation.status, 'activation_required');
  assert.equal(activation.deliveryConfirmed, false);
});

test('HTTP rejection, invalid responses and timeout are never reported as accepted', async () => {
  const options = { emailTo: 'recipient@example.test' };
  assert.equal((await submitToFormSubmit(record(), { ...options, fetchImpl: async () => new Response('rate limited', { status: 429 }) })).errorCode, 'HTTP_429');
  assert.equal((await submitToFormSubmit(record(), { ...options, fetchImpl: async () => new Response('<html>challenge</html>', { status: 200 }) })).errorCode, 'INVALID_PROVIDER_RESPONSE');
  assert.equal((await submitToFormSubmit(record(), { ...options, fetchImpl: async () => new Response(JSON.stringify({ success: false }), { status: 200 }) })).errorCode, 'PROVIDER_REJECTED');
  const timeout = await submitToFormSubmit(record(), { ...options, timeoutMs: 5, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('request aborted')), { once: true })) });
  assert.equal(timeout.errorCode, 'TIMEOUT');
  assert.equal(timeout.deliveryConfirmed, false);
});

test('persistent outbox retries transport failure with delay and stops after three attempts', async (t) => {
  const dataDir = await dirFixture(t);
  let now = Date.parse('2026-10-08T00:00:00Z');
  let calls = 0;
  const mailer = createInquiryMailer({ dataDir, emailTo: 'recipient@example.test', intervalMs: 0, now: () => now, fetchImpl: async () => { calls++; throw new Error('simulated outage'); } });
  const item = { ...record(), emailForwarding: mailer.initialState() };
  await appendInquiry(dataDir, item);
  await mailer.schedule(item.id);
  await mailer.drain();
  assert.equal(calls, 1);
  now += 61_000;
  await mailer.drain();
  assert.equal(calls, 2);
  now += 5 * 60_000 + 1;
  await mailer.drain();
  assert.equal(calls, 3);
  const retained = (await withInquiryLock(dataDir, readInquiryFile))[0];
  assert.equal(retained.phone, item.phone);
  assert.equal(retained.emailForwarding.status, 'failed');
  assert.equal(retained.emailForwarding.errorCode, 'NETWORK_ERROR');
  assert.equal(retained.emailForwarding.attempts, 3);
  await mailer.drain();
  assert.equal(calls, 3);
  mailer.stop();
});

test('inquiry API persists before forwarding and returns receipt even when mail transport is unavailable', async (t) => {
  const dir = await dirFixture(t);
  const publicDir = path.join(dir, 'public');
  const dataDir = path.join(dir, 'data');
  await mkdir(publicDir);
  let persistedBeforeTransport = false;
  const app = createApp({ publicDir, dataDir, adminToken: 'test-token-with-more-than-32-ascii-characters', emailTo: 'recipient@example.test', emailIntervalMs: 0, emailFetch: async () => {
    persistedBeforeTransport = Boolean((await readFile(path.join(dataDir, 'inquiries.jsonl'), 'utf8')).includes('테스트 문의'));
    throw new Error('simulated mail failure');
  }, renderPage: () => ({ html: '<h1>test</h1>' }) });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  t.after(async () => { app.stopBackgroundWork(); await new Promise((resolve) => { app.close(resolve); app.closeIdleConnections(); }); await app.pendingWrites(); });
  const item = record();
  const response = await fetch(`http://127.0.0.1:${app.address().port}/api/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, website: '' }) });
  assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.equal(receipt.emailForwarding.status, 'pending');
  assert.equal(receipt.emailForwarding.deliveryConfirmed, false);
  await app.pendingWrites();
  assert.equal(persistedBeforeTransport, true);
  const stored = (await withInquiryLock(dataDir, readInquiryFile))[0];
  assert.equal(stored.id, receipt.id);
  assert.equal(stored.emailForwarding.status, 'retry');
});

test('disabled forwarding performs no network requests', async (t) => {
  const dataDir = await dirFixture(t);
  const mailer = createInquiryMailer({ dataDir, emailTo: '', fetchImpl: () => { throw new Error('must not be called'); } });
  assert.equal(mailer.initialState(), undefined);
  await mailer.schedule('anything');
  await mailer.drain();
  mailer.stop();
});
