import http from 'node:http';
import { constants, createReadStream } from 'node:fs';
import { access, mkdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { appendInquiry, readInquiryFile, withInquiryLock } from './lib/inquiry-store.mjs';
import { createInquiryMailer } from './lib/inquiry-email.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MAX_BODY = 32 * 1024;
const MAX_ADMIN_FILE = 16 * 1024 * 1024;
const TYPES = new Set(['construction', 'management', 'iot']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function securityHeaders(res, production) {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'", "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https:", "media-src 'self' blob: https:",
    "connect-src 'self'", "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  ].join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
}

function json(res, status, body, method = 'GET') {
  const content = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(content),
    'Cache-Control': 'no-store',
  });
  res.end(method === 'HEAD' ? undefined : content);
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function noControls(value) {
  return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
}

export function validateRuntimeConfiguration({ production, adminToken, publicOrigin }) {
  const validToken = typeof adminToken === 'string' && /^[\x21-\x7e]{32,512}$/.test(adminToken);
  if (production && !validToken) throw new Error('Production requires ADMIN_TOKEN with 32–512 non-whitespace ASCII characters');
  if (publicOrigin) {
    const origin = new URL(publicOrigin);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) throw new Error('PUBLIC_ORIGIN or SITE_URL must be an HTTP(S) origin');
  }
  return { validToken };
}

/** Public form validation. Never trust client-side validation. */
export function validateInquiry(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: { form: '올바른 문의 내용을 보내 주세요.' } };
  }
  const errors = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const company = typeof input.company === 'string' ? input.company.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const message = typeof input.message === 'string' ? input.message.trim() : '';
  const website = typeof input.website === 'string' ? input.website.trim() : '';
  if (!TYPES.has(input.type)) errors.type = '문의 분야를 선택해 주세요.';
  if (name.length < 2 || name.length > 50 || !noControls(name) || /[\r\n]/u.test(name)) {
    errors.name = '성함을 2~50자로 입력해 주세요.';
  }
  if (company.length > 100 || !noControls(company) || /[\r\n]/u.test(company)) {
    errors.company = '회사명을 100자 이내로 입력해 주세요.';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15 || phone.length > 30 || !/^[+\d\s().-]+$/u.test(phone)) {
    errors.phone = '연락 가능한 전화번호를 입력해 주세요.';
  }
  if (message.length < 10 || message.length > 4000 || !noControls(message)) {
    errors.message = '문의 내용을 10~4,000자로 입력해 주세요.';
  }
  if (input.consent !== true) errors.consent = '개인정보 수집·이용에 동의해 주세요.';
  if (input.website !== undefined && (typeof input.website !== 'string' || website.length > 200)) {
    errors.form = '올바른 문의 내용을 보내 주세요.';
  }
  return {
    valid: Object.keys(errors).length === 0, errors,
    value: { type: input.type, name, company, phone, message, consent: true },
    honeypot: Boolean(website),
  };
}

async function readJson(req, limit = MAX_BODY) {
  const declaredLength = req.headers['content-length'];
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > limit)) {
    req.resume();
    throw httpError(413, '문의 내용이 너무 큽니다.');
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    let settled = false;
    const fail = (error) => { if (!settled) { settled = true; reject(error); } };
    req.on('data', (chunk) => {
      if (settled) return;
      length += chunk.length;
      if (length > limit) {
        chunks.length = 0;
        fail(httpError(413, '문의 내용이 너무 큽니다.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        settled = true;
        resolve(parsed);
      } catch {
        fail(httpError(400, '올바른 JSON 요청이 필요합니다.'));
      }
    });
    req.on('aborted', () => fail(httpError(400, '요청이 중단되었습니다.')));
    req.on('error', () => fail(httpError(400, '요청을 읽을 수 없습니다.')));
  });
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function parseRange(range, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  let start;
  let end;
  if (!match[1]) {
    const count = Number(match[2]);
    if (!Number.isSafeInteger(count) || count <= 0) return null;
    start = Math.max(0, size - count);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start < 0 || end < start) return null;
  return { start, end };
}

async function serveStatic(req, res, pathname, publicDir, production) {
  const candidate = path.resolve(publicDir, `.${pathname}`);
  if (!isInside(publicDir, candidate)) throw httpError(400, '잘못된 경로입니다.');
  let actualPath;
  let info;
  try {
    actualPath = await realpath(candidate);
    if (!isInside(publicDir, actualPath)) throw httpError(403, '접근할 수 없는 파일입니다.');
    info = await stat(actualPath);
  } catch (error) {
    if (error.status) throw error;
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
  if (!info.isFile()) return false;
  const mime = MIME[path.extname(actualPath).toLowerCase()] || 'application/octet-stream';
  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  res.setHeader('Content-Type', mime);
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', info.mtime.toUTCString());
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', production ? 'public, max-age=3600' : 'no-cache');
  if (pathname.startsWith('/downloads/')) {
    res.setHeader('Content-Disposition', `attachment; filename="download${path.extname(actualPath)}"; filename*=UTF-8''${encodeURIComponent(path.basename(actualPath))}`);
  }
  if (req.headers['if-none-match'] === etag && !req.headers.range) {
    res.writeHead(304);
    res.end();
    return true;
  }
  let range = req.headers.range;
  if (range && req.headers['if-range']) {
    const ifRange = req.headers['if-range'];
    // Weak ETags cannot satisfy If-Range; a current Last-Modified date can.
    if (ifRange !== info.mtime.toUTCString()) range = undefined;
  }
  let start = 0;
  let end = Math.max(info.size - 1, 0);
  let status = 200;
  if (range) {
    const parsed = parseRange(range, info.size);
    if (!parsed) {
      res.writeHead(416, { 'Content-Range': `bytes */${info.size}`, 'Content-Length': 0 });
      res.end();
      return true;
    }
    ({ start, end } = parsed);
    status = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
  }
  res.setHeader('Content-Length', status === 206 ? end - start + 1 : info.size);
  res.writeHead(status);
  if (req.method === 'HEAD' || info.size === 0) {
    res.end();
    return true;
  }
  const stream = createReadStream(actualPath, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
  return true;
}

/** Accepts an injected renderer to test API behavior without importing the UI. */
export function createApp(options = {}) {
  const publicDir = path.resolve(options.publicDir || path.join(ROOT, 'public'));
  const dataDir = path.resolve(options.dataDir || process.env.DATA_DIR || path.join(ROOT, 'data'));
  const adminToken = options.adminToken ?? process.env.ADMIN_TOKEN ?? '';
  const renderer = options.renderPage;
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const trustProxy = options.trustProxy ?? Boolean(process.env.FLY_APP_NAME);
  const publicOrigin = options.publicOrigin ?? process.env.PUBLIC_ORIGIN ?? process.env.SITE_URL;
  const { validToken } = validateRuntimeConfiguration({ production, adminToken, publicOrigin });
  const rateLimit = options.rateLimit ?? 5;
  const rateWindow = options.rateWindow ?? 15 * 60 * 1000;
  const emailTo = options.emailTo ?? process.env.EMAIL_TO ?? (production ? 'yurimkorea@gmail.com' : '');
  const siteUrl = publicOrigin || (process.env.FLY_APP_NAME ? `https://${process.env.FLY_APP_NAME}.fly.dev` : undefined);
  const mailer = createInquiryMailer({ dataDir, emailTo, siteUrl, fetchImpl: options.emailFetch, timeoutMs: options.emailTimeoutMs, intervalMs: options.emailIntervalMs });
  const attempts = new Map();
  let appendQueue = Promise.resolve();

  function takeAttempt(req) {
    const now = Date.now();
    const forwarded = req.headers['fly-client-ip'];
    const ip = trustProxy && typeof forwarded === 'string' ? forwarded.slice(0, 100) : req.socket.remoteAddress || 'unknown';
    for (const [key, value] of attempts) if (now - value.since >= rateWindow) attempts.delete(key);
    let entry = attempts.get(ip);
    if (!entry) { entry = { since: now, count: 0 }; attempts.set(ip, entry); }
    entry.count += 1;
    return entry.count <= rateLimit ? 0 : Math.ceil((rateWindow - (now - entry.since)) / 1000);
  }

  function hasAdminAccess(req) {
    if (!validToken) return false;
    const provided = req.headers.authorization || '';
    const expected = `Bearer ${adminToken}`;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  async function saveInquiry(record) {
    const operation = appendQueue.catch(() => {}).then(async () => {
      await appendInquiry(dataDir, record);
    });
    appendQueue = operation;
    await operation;
  }

  const server = http.createServer(async (req, res) => {
    securityHeaders(res, production);
    try {
      const rawPath = (req.url || '/').split('?')[0];
      let decoded;
      try { decoded = decodeURIComponent(rawPath); } catch { throw httpError(400, '잘못된 경로입니다.'); }
      if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').includes('..')) {
        throw httpError(400, '잘못된 경로입니다.');
      }
      const url = new URL(req.url || '/', 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === '/healthz') {
        if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return json(res, 405, { error: '지원하지 않는 요청 방식입니다.' }, req.method); }
        return json(res, 200, { status: 'ok' }, req.method);
      }
      if (pathname === '/api/inquiries') {
        if (req.method === 'POST') {
          if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
            req.resume();
            return json(res, 415, { error: 'Content-Type은 application/json이어야 합니다.' });
          }
          if (req.headers.origin) {
            let sameOrigin = false;
            try {
              const origin = new URL(req.headers.origin);
              sameOrigin = ['http:', 'https:'].includes(origin.protocol) && !origin.username && !origin.password && origin.pathname === '/' && !origin.search && !origin.hash && (publicOrigin ? origin.origin === new URL(publicOrigin).origin : origin.host === req.headers.host?.toLowerCase());
            } catch { /* Reject invalid origins. */ }
            if (!sameOrigin) { req.resume(); return json(res, 403, { error: '허용되지 않은 요청입니다.' }); }
          }
          const retryAfter = takeAttempt(req);
          if (retryAfter) { req.resume(); res.setHeader('Retry-After', retryAfter); return json(res, 429, { error: '잠시 후 다시 문의해 주세요.' }); }
          const input = await readJson(req, options.bodyLimit ?? MAX_BODY);
          const result = validateInquiry(input);
          if (!result.valid) return json(res, 422, { ok: false, error: '입력 내용을 확인해 주세요.', errors: result.errors });
          if (result.honeypot) return json(res, 422, { ok: false, error: '문의 요청을 확인해 주세요.' });
          const id = randomUUID();
          const emailForwarding = mailer.initialState();
          await saveInquiry({ id, receivedAt: new Date().toISOString(), ...result.value, privacyVersion: '2026-10-08', ...(emailForwarding ? { emailForwarding } : {}) });
          if (emailForwarding) mailer.schedule(id);
          return json(res, 201, { ok: true, id, message: '문의가 접수되었습니다. 확인 후 연락드리겠습니다.', ...(emailForwarding ? { emailForwarding: { status: 'pending', deliveryConfirmed: false } } : {}) });
        }
        if (req.method === 'GET') {
          if (!validToken) return json(res, 503, { error: '관리자 조회가 설정되어 있지 않습니다.' });
          if (!hasAdminAccess(req)) {
            res.setHeader('WWW-Authenticate', 'Bearer');
            return json(res, 401, { error: '관리자 인증이 필요합니다.' });
          }
          await appendQueue.catch(() => {});
          const records = await withInquiryLock(dataDir, (storePath) => readInquiryFile(storePath, MAX_ADMIN_FILE));
          return json(res, 200, { inquiries: records });
        }
        res.setHeader('Allow', 'POST, GET');
        return json(res, 405, { error: '지원하지 않는 요청 방식입니다.' });
      }
      if (pathname.startsWith('/api/')) return json(res, 404, { error: '찾을 수 없는 주소입니다.' });
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.setHeader('Allow', 'GET, HEAD');
        return json(res, 405, { error: '지원하지 않는 요청 방식입니다.' });
      }
      if (await serveStatic(req, res, pathname, publicDir, production)) return;
      if (typeof renderer !== 'function') throw httpError(503, '페이지를 준비 중입니다.');
      const rendered = await renderer(pathname);
      const html = typeof rendered === 'string' ? rendered : rendered?.html;
      const status = typeof rendered === 'string' ? 200 : rendered?.status ?? 200;
      if (typeof html !== 'string') throw httpError(500, '페이지를 표시할 수 없습니다.');
      res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(html),
        'Cache-Control': 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : html);
    } catch (error) {
      if (!res.headersSent && !res.destroyed) {
        json(res, error.status || 500, { error: error.status ? error.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, req.method);
      } else if (!res.destroyed) res.destroy();
      if (!error.status) console.error('Request failed:', error.code || error.name || 'unknown');
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  server.on('clientError', (_error, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  });
  server.pendingWrites = () => Promise.all([appendQueue, mailer.pending()]);
  server.stopBackgroundWork = () => mailer.stop();
  server.on('close', () => mailer.stop());
  server.retryPendingEmails = () => mailer.drain();
  return server;
}

export async function startServer() {
  const { renderPage } = await import('./src/render.mjs');
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  const dataDir = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await access(dataDir, constants.W_OK);
  const server = createApp({ renderPage });
  server.listen(port, process.env.HOST || '0.0.0.0', () => {
    console.log(`유림엔지니어링 website listening on port ${port}`);
    server.retryPendingEmails().catch((error) => console.error('Inquiry email queue unavailable:', error.code || 'STORE_ERROR'));
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    server.stopBackgroundWork();
    server.close(async () => {
      try { await server.pendingWrites(); process.exitCode = 0; } catch { process.exitCode = 1; }
      clearTimeout(deadline);
    });
    server.closeIdleConnections();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  startServer().catch((error) => { console.error('Unable to start server:', error.code || error.message); process.exitCode = 1; });
}
