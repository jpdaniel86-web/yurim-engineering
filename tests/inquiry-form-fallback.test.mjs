import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.mjs';
import { renderInquiryResponse } from '../src/render.mjs';

const valid = { type: 'iot', name: '검수 사용자', company: '검수 회사', phone: '010-1234-5678', message: '문의 양식의 서버 처리를 확인하는 검수입니다.', consent: 'on', website: '' };
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

async function fixture(t, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'yurim-form-test-'));
  const publicDir = path.join(directory, 'public');
  const dataDir = path.join(directory, 'data');
  await mkdir(publicDir);
  const renderedResponses = [];
  const app = createApp({
    publicDir, dataDir, rateLimit: 100, emailTo: '',
    adminToken: 'form-test-token-with-at-least-32-characters',
    renderPage: () => '<h1>유림엔지니어링</h1>',
    renderInquiryResponse: response => {
      renderedResponses.push(response);
      return `<h1>${escapeHTML(response.message)}</h1><input name="name" value="${escapeHTML(response.values.name)}"><input name="phone" value="${escapeHTML(response.values.phone)}"><textarea>${escapeHTML(response.values.message)}</textarea><p>${Object.values(response.errors).map(escapeHTML).join(' ')}</p><p>${escapeHTML(response.id)}</p>`;
    },
    ...options,
  });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.address().port}`;
  t.after(async () => {
    await new Promise(resolve => { app.close(resolve); app.closeIdleConnections(); });
    await app.pendingWrites();
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('yurim-form-test-'));
    await rm(directory, { recursive: true, force: true });
  });
  return { app, base, dataDir, renderedResponses };
}

function submitForm(base, values = valid, headers = {}) {
  return fetch(`${base}/api/inquiries`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', ...headers },
    body: values instanceof URLSearchParams ? values : new URLSearchParams(values),
  });
}

test('native form POST accepts consent, saves a durable record and returns private HTML confirmation', async t => {
  const { base, dataDir, renderedResponses } = await fixture(t);
  const response = await submitForm(base);
  assert.equal(response.status, 201);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('location'), null);
  assert.match(response.headers.get('content-security-policy'), /form-action 'self'/);
  const record = JSON.parse((await readFile(path.join(dataDir, 'inquiries.jsonl'), 'utf8')).trim());
  assert.equal(record.type, valid.type);
  assert.equal(record.consent, true);
  assert.equal(record.message, valid.message);
  assert.equal(renderedResponses[0].id, record.id);
  assert.equal(renderedResponses[0].values.type, valid.type);
  assert.equal(renderedResponses[0].values.name, '');
  assert.match(await response.text(), new RegExp(record.id));
  const privateGet = await fetch(`${base}/api/inquiries`);
  assert.equal(privateGet.status, 401);
  assert.ok(!(await privateGet.text()).includes(valid.phone));
});

test('native form validation retains entered values and field-specific errors without storing an inquiry', async t => {
  const { base, dataDir, renderedResponses } = await fixture(t);
  const input = { ...valid, name: '검수 <사용자>', phone: 'abc', message: '<script>alert("검수")</script> 문의 내용', consent: '' };
  const response = await submitForm(base, input);
  assert.equal(response.status, 422);
  const rendered = renderedResponses[0];
  assert.equal(rendered.values.name, input.name);
  assert.equal(rendered.values.phone, input.phone);
  assert.equal(rendered.values.message, input.message);
  assert.equal(rendered.values.consent, false);
  assert.equal(rendered.id, undefined);
  assert.match(rendered.errors.phone, /전화번호/);
  assert.match(rendered.errors.consent, /동의/);
  const html = await response.text();
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(response.headers.get('location'), null);
  await assert.rejects(readFile(path.join(dataDir, 'inquiries.jsonl')), { code: 'ENOENT' });
});

test('unchecked consent and duplicate form fields are rejected before any record is saved', async t => {
  const { base, dataDir } = await fixture(t);
  const unchecked = new URLSearchParams(valid);
  unchecked.delete('consent');
  assert.equal((await submitForm(base, unchecked)).status, 422);
  const duplicate = new URLSearchParams(valid);
  duplicate.append('consent', 'false');
  const response = await submitForm(base, duplicate);
  assert.equal(response.status, 400);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  assert.match(await response.text(), /중복된 입력 항목/);
  await assert.rejects(readFile(path.join(dataDir, 'inquiries.jsonl')), { code: 'ENOENT' });
});

test('native form POST preserves origin checks, body limits, honeypot and rate limiting', async t => {
  const { base, dataDir } = await fixture(t, { rateLimit: 2, bodyLimit: 1024 });
  const foreign = await submitForm(base, valid, { Origin: 'https://other.example.invalid' });
  assert.equal(foreign.status, 403);
  assert.match(foreign.headers.get('content-type'), /^text\/html/);
  assert.equal((await submitForm(base, { ...valid, website: 'https://spam.example.invalid' })).status, 422);
  assert.equal((await submitForm(base, { ...valid, message: 'a'.repeat(1500) })).status, 413);
  const limited = await submitForm(base);
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
  assert.match(limited.headers.get('content-type'), /^text\/html/);
  await assert.rejects(readFile(path.join(dataDir, 'inquiries.jsonl')), { code: 'ENOENT' });
});

test('form acceptance distinguishes durable receipt from unconfirmed email delivery using only a stub', async t => {
  const { base, renderedResponses } = await fixture(t, {
    emailTo: 'fixture@example.invalid', emailIntervalMs: 60_000,
    emailFetch: async () => ({ ok: true, status: 200, json: async () => ({ success: true }) }),
  });
  const response = await submitForm(base);
  assert.equal(response.status, 201);
  assert.deepEqual(renderedResponses[0].emailForwarding, { status: 'pending', deliveryConfirmed: false });
});

test('a missing form-response renderer still returns confirmation and alternate contact routes', async t => {
  const { base } = await fixture(t, { renderInquiryResponse: undefined });
  const response = await submitForm(base);
  assert.equal(response.status, 201);
  const html = await response.text();
  assert.match(html, /접수번호: [a-f\d-]{36}/);
  assert.match(html, /href="tel:0317748358"/);
  assert.match(html, /href="mailto:yurimkorea@gmail.com"/);
  assert.match(html, /href="\/contact\/iot"/);
  assert.doesNotMatch(html, /담당자 이메일.*완료|이메일.*전달되었습니다/);
});

test('the real contact page handles no-JavaScript errors and successful receipt through the server', async t => {
  const { base } = await fixture(t, { renderInquiryResponse });
  const invalid = await submitForm(base, { ...valid, name: '검수 <사용자>', phone: 'abcdefgh' });
  assert.equal(invalid.status, 422);
  const errorHtml = await invalid.text();
  assert.match(errorHtml, /value="검수 &lt;사용자&gt;"/);
  assert.match(errorHtml, /id="inquiry-phone"[^>]*value="abcdefgh"[^>]*aria-invalid="true"/);
  assert.match(errorHtml, /aria-describedby="inquiry-phone-error"/);
  assert.match(errorHtml, /href="#inquiry-phone"/);
  assert.match(errorHtml, /name="consent" required checked/);
  assert.match(errorHtml, /method="post" action="\/api\/inquiries"/);
  const accepted = await submitForm(base);
  assert.equal(accepted.status, 201);
  const confirmation = await accepted.text();
  assert.match(confirmation, /class="inquiry-confirmation"/);
  assert.match(confirmation, /class="inquiry-id">[a-f\d-]{36}/);
  assert.doesNotMatch(confirmation, /id="inquiry-form"/);
  assert.doesNotMatch(confirmation, /이메일.*전달되었습니다/);
});
