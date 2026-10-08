import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp, validateInquiry, validateRuntimeConfiguration } from '../server.mjs';

const valid = {
  type: 'construction', name: '홍길동', company: '샘플 회사',
  phone: '010-1234-5678', message: '처리 시설 상담을 요청드립니다.', consent: true, website: '',
};
const token = 'testing-only-admin-token-with-at-least-32-characters';

async function fixture(t, options = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'yurim-server-test-'));
  const publicDir = path.join(dir, 'public');
  const dataDir = path.join(dir, 'data');
  await mkdir(publicDir);
  await mkdir(path.join(publicDir, 'assets'));
  await mkdir(path.join(publicDir, 'downloads'));
  await writeFile(path.join(publicDir, 'assets', 'hero.mp4'), '0123456789');
  await writeFile(path.join(publicDir, 'downloads', '소개자료.pdf'), 'test pdf');
  await writeFile(path.join(dir, 'secret.txt'), 'not public');
  const app = createApp({
    publicDir, dataDir, adminToken: token, rateLimit: 100,
    renderPage: (pathname) => ({ html: `<h1>${pathname === '/' ? '유림엔지니어링' : '찾을 수 없음'}</h1>`, status: pathname === '/' ? 200 : 404 }),
    ...options,
  });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const address = app.address();
  const base = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    await new Promise((resolve) => { app.close(resolve); app.closeIdleConnections(); });
    await app.pendingWrites();
    // This is the exact directory returned by mkdtemp above, never a computed external path.
    await rm(dir, { recursive: true, force: true });
  });
  return { app, base, port: address.port, dir, publicDir, dataDir };
}

function submit(base, body = valid, headers = {}) {
  return fetch(`${base}/api/inquiries`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}

function rawRequest(port, requestPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: requestPath }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('validation rejects invalid consent, category, telephone and short messages', () => {
  assert.equal(validateInquiry(valid).valid, true);
  for (const override of [
    { name: '김' }, { type: 'anything' }, { phone: 'call me' },
    { message: '짧음' }, { consent: false }, { company: 'a'.repeat(101) },
    { name: '홍\n길동' }, { message: `긴 문의 내용${'a'.repeat(4000)}` },
  ]) assert.equal(validateInquiry({ ...valid, ...override }).valid, false);
  assert.equal(validateInquiry(null).valid, false);
  assert.equal(validateInquiry([]).valid, false);
  assert.equal(validateInquiry({ ...valid, name: ' 홍길동 ' }).value.name, '홍길동');
});

test('inquiry submission appends durable records and authenticated admin can read them', async (t) => {
  const { base, dataDir } = await fixture(t);
  const first = await submit(base);
  assert.equal(first.status, 201);
  const result = await first.json();
  assert.equal(result.ok, true);
  assert.match(result.id, /^[\da-f-]{36}$/);
  const line = JSON.parse((await readFile(path.join(dataDir, 'inquiries.jsonl'), 'utf8')).trim());
  assert.equal(line.name, valid.name);
  assert.equal(line.id, result.id);
  assert.equal(line.consent, true);
  assert.equal(line.privacyVersion, '2026-10-08');
  assert.ok(Number.isFinite(Date.parse(line.receivedAt)));
  const admin = await fetch(`${base}/api/inquiries`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(admin.status, 200);
  assert.equal((await admin.json()).inquiries[0].phone, valid.phone);
  assert.equal(admin.headers.get('cache-control'), 'no-store');
});

test('concurrent submissions preserve complete separate JSONL records', async (t) => {
  const { base, dataDir } = await fixture(t);
  const responses = await Promise.all(Array.from({ length: 5 }, (_, i) => submit(base, { ...valid, name: `문의자${i}` })));
  assert.ok(responses.every((response) => response.status === 201));
  const records = (await readFile(path.join(dataDir, 'inquiries.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(records.length, 5);
  assert.equal(new Set(records.map((record) => record.id)).size, 5);
});

test('unauthenticated, wrong and short administrator tokens cannot reveal inquiries', async (t) => {
  const { base } = await fixture(t);
  await submit(base);
  for (const authorization of ['', 'Bearer incorrect', `Bearer ${token.slice(0, -1)}`]) {
    const response = await fetch(`${base}/api/inquiries`, { headers: { Authorization: authorization } });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('www-authenticate'), 'Bearer');
    assert.ok(!(await response.text()).includes(valid.phone));
  }
  const other = await fixture(t, { adminToken: 'too-short' });
  assert.equal((await fetch(`${other.base}/api/inquiries`, { headers: { Authorization: 'Bearer too-short' } })).status, 503);
});

test('invalid form and honeypot submissions do not enter the inquiry file', async (t) => {
  const { base, dataDir } = await fixture(t);
  const invalid = await submit(base, { ...valid, consent: false });
  assert.equal(invalid.status, 422);
  assert.ok((await invalid.json()).errors.consent);
  const bot = await submit(base, { ...valid, website: 'https://spam.invalid' });
  assert.equal(bot.status, 422);
  await assert.rejects(readFile(path.join(dataDir, 'inquiries.jsonl')), { code: 'ENOENT' });
});

test('API enforces request method, JSON type, origin, body size and malformed JSON', async (t) => {
  const { base } = await fixture(t);
  const method = await fetch(`${base}/api/inquiries`, { method: 'PUT' });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'POST, GET');
  assert.equal((await submit(base, valid, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await submit(base, valid, { Origin: 'https://evil.invalid' })).status, 403);
  assert.equal((await submit(base, valid, { Origin: 'null' })).status, 403);
  assert.equal((await submit(base, valid, { Origin: `ftp://${new URL(base).host}` })).status, 403);
  assert.equal((await submit(base, valid, { Origin: `${base}/unexpected-path` })).status, 403);
  assert.equal((await submit(base, valid, { Origin: base })).status, 201);
  assert.equal((await submit(base, { ...valid, message: 'a'.repeat(33 * 1024) })).status, 413);
  const malformed = await fetch(`${base}/api/inquiries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{wrong' });
  assert.equal(malformed.status, 400);
});

test('configured site origin permits its form and rejects other origins without blocking API clients', async (t) => {
  const { base } = await fixture(t, { publicOrigin: 'https://engineering.example' });
  assert.equal((await submit(base, valid, { Origin: 'https://engineering.example' })).status, 201);
  assert.equal((await submit(base, valid, { Origin: 'https://other.example' })).status, 403);
  assert.equal((await submit(base)).status, 201);
});

test('production startup requires a configured token and rejects whitespace-only secrets', () => {
  for (const adminToken of ['', 'short', ' '.repeat(32), `invalid\n${'a'.repeat(40)}`]) {
    assert.throws(() => validateRuntimeConfiguration({ production: true, adminToken }), /Production requires ADMIN_TOKEN/);
  }
  assert.equal(validateRuntimeConfiguration({ production: true, adminToken: token }).validToken, true);
  assert.equal(validateRuntimeConfiguration({ production: false, adminToken: '' }).validToken, false);
  assert.throws(() => validateRuntimeConfiguration({ production: false, adminToken: '', publicOrigin: 'ftp://site.example' }), /HTTP/);
});

test('rate limiter rejects excess requests with Retry-After', async (t) => {
  const { base } = await fixture(t, { rateLimit: 2 });
  assert.equal((await submit(base)).status, 201);
  assert.equal((await submit(base)).status, 201);
  const response = await submit(base);
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
});

test('static video supports bounded, suffix and HEAD byte ranges', async (t) => {
  const { base } = await fixture(t);
  const response = await fetch(`${base}/assets/hero.mp4`, { headers: { Range: 'bytes=2-5' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-type'), 'video/mp4');
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('cache-control'), 'no-cache');
  assert.equal(response.headers.get('content-range'), 'bytes 2-5/10');
  assert.equal(response.headers.get('content-length'), '4');
  assert.equal(await response.text(), '2345');
  const suffix = await fetch(`${base}/assets/hero.mp4`, { headers: { Range: 'bytes=-3' } });
  assert.equal(await suffix.text(), '789');
  const open = await fetch(`${base}/assets/hero.mp4`, { headers: { Range: 'bytes=8-' } });
  assert.equal(await open.text(), '89');
  const head = await fetch(`${base}/assets/hero.mp4`, { method: 'HEAD', headers: { Range: 'bytes=2-5' } });
  assert.equal(head.status, 206);
  assert.equal(head.headers.get('content-length'), '4');
  assert.equal(await head.text(), '');
  const invalid = await fetch(`${base}/assets/hero.mp4`, { headers: { Range: 'bytes=100-200' } });
  assert.equal(invalid.status, 416);
  assert.equal(invalid.headers.get('content-range'), 'bytes */10');
});

test('static validators, download filenames, SSR status and security headers are correct', async (t) => {
  const { base } = await fixture(t, { production: true });
  const asset = await fetch(`${base}/assets/hero.mp4`);
  await asset.arrayBuffer();
  const cached = await fetch(`${base}/assets/hero.mp4`, { headers: { 'If-None-Match': asset.headers.get('etag') } });
  assert.equal(cached.status, 304);
  const download = await fetch(`${base}/downloads/${encodeURIComponent('소개자료.pdf')}`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment;.*filename\*=UTF-8''/);
  assert.equal(await download.text(), 'test pdf');
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /유림엔지니어링/);
  assert.match(home.headers.get('content-security-policy'), /object-src 'none'/);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('strict-transport-security'), 'max-age=31536000');
  assert.equal((await fetch(`${base}/missing-page`)).status, 404);
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
});

test('encoded traversal, backslashes and malformed paths never expose files outside public', async (t) => {
  const { port } = await fixture(t);
  for (const requestPath of ['/../secret.txt', '/%2e%2e/secret.txt', '/%2e%2e%2fsecret.txt', '/%5c..%5csecret.txt', '/%00secret.txt', '/%ZZ']) {
    const response = await rawRequest(port, requestPath);
    assert.equal(response.status, 400, requestPath);
    assert.ok(!response.body.includes('not public'));
  }
});
