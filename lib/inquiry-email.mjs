import { readInquiryFile, updateInquiries, withInquiryLock } from './inquiry-store.mjs';

const LABELS = { construction: '공사문의', management: '시설관리 문의', iot: 'IoT 서비스 문의' };
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS = [60_000, 5 * 60_000];
const FINAL = new Set(['accepted', 'activation_required', 'failed']);

export function safeProviderMessage(message, record = {}) {
  if (typeof message !== 'string') return undefined;
  let safe = message.replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const key of ['name', 'company', 'phone', 'message']) {
    const value = record[key];
    if (typeof value === 'string' && value.length >= 2) safe = safe.replaceAll(value, '[redacted]');
  }
  safe = safe.replace(/[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]');
  return safe.slice(0, 300) || undefined;
}

export function validateEmailDestination(emailTo) {
  if (emailTo && (typeof emailTo !== 'string' || emailTo.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailTo))) {
    throw new Error('EMAIL_TO must be one valid email address');
  }
}

export function formSubmitPayload(record, siteUrl) {
  const payload = {
    _subject: `[유림엔지니어링] ${LABELS[record.type] || '홈페이지 문의'} / ${record.id}`,
    _template: 'table', _captcha: 'false',
    '접수번호': record.id, '접수일시(UTC)': record.receivedAt,
    '문의분야': LABELS[record.type] || record.type,
    '성함': record.name, '회사·기관명': record.company || '',
    '연락처': record.phone, '문의내용': record.message,
    '개인정보 수집·이용 동의': record.consent ? '동의' : '미동의',
  };
  if (siteUrl) payload._url = new URL(`/contact/${record.type}`, siteUrl).href;
  return payload;
}

/** A provider's acceptance is never evidence of mailbox delivery. */
export async function submitToFormSubmit(record, { emailTo, siteUrl, fetchImpl = fetch, timeoutMs = 8_000 } = {}) {
  validateEmailDestination(emailTo);
  if (!emailTo) return { status: 'disabled', deliveryConfirmed: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetchImpl(`https://formsubmit.co/ajax/${encodeURIComponent(emailTo)}`, {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(siteUrl ? { Referer: new URL('/contact', siteUrl).href } : {}) },
      body: JSON.stringify(formSubmitPayload(record, siteUrl)),
    });
    if (!response.ok) return { status: 'retry', errorCode: `HTTP_${response.status}`, deliveryConfirmed: false };
    const body = await response.json();
    const providerMessage = safeProviderMessage(body?.message, record);
    const diagnostic = providerMessage ? { providerMessage } : {};
    const providerAccepted = body?.success === true || body?.success === 'true';
    // FormSubmit returns HTTP 200 with success:"false" for a new mailbox:
    // "This form needs Activation." This requires owner confirmation, not
    // transport retries and is never described as accepted or delivered.
    const activation = typeof body.message === 'string' && (
      /\b(?:form|email)\b.{0,60}\b(?:needs|requires?)\b.{0,30}\bactivation\b/i.test(body.message)
      || /\b(?:please|must)\b.{0,60}\bactivat(?:e|ion)\b/i.test(body.message)
      || /\bactivation\b.{0,60}\brequired\b/i.test(body.message)
    );
    if (activation) return { status: 'activation_required', errorCode: 'ACTIVATION_REQUIRED', providerAccepted, ...diagnostic, deliveryConfirmed: false };
    if (!providerAccepted) return { status: 'retry', errorCode: 'PROVIDER_REJECTED', providerAccepted: false, ...diagnostic, deliveryConfirmed: false };
    return { status: 'accepted', providerAccepted: true, ...diagnostic, deliveryConfirmed: false };
  } catch (error) {
    return { status: 'retry', errorCode: controller.signal.aborted ? 'TIMEOUT' : error instanceof SyntaxError ? 'INVALID_PROVIDER_RESPONSE' : 'NETWORK_ERROR', deliveryConfirmed: false };
  } finally { clearTimeout(timeout); }
}

/** Persistent outbox state lives on each stored inquiry and survives restarts. */
export function createInquiryMailer({ dataDir, emailTo, siteUrl, fetchImpl = fetch, timeoutMs = 8_000, intervalMs = 60_000, now = () => Date.now() } = {}) {
  validateEmailDestination(emailTo);
  let queue = Promise.resolve();
  let stopped = false;
  let timer;

  async function snapshot() {
    return withInquiryLock(dataDir, (storePath) => readInquiryFile(storePath));
  }

  async function setState(id, state) {
    return updateInquiries(dataDir, (records) => ({
      records: records.map((record) => record.id === id ? { ...record, emailForwarding: state } : record),
      result: records.some((record) => record.id === id),
    }));
  }

  async function attempt(id) {
    const record = (await snapshot()).find((item) => item.id === id);
    const state = record?.emailForwarding;
    if (!record || !state || FINAL.has(state.status)) return state;
    if (state.nextAttemptAt && Date.parse(state.nextAttemptAt) > now()) return state;
    if (Number(state.attempts || 0) >= MAX_ATTEMPTS) {
      const exhausted = { ...state, status: 'failed', deliveryConfirmed: false, errorCode: state.errorCode || 'ATTEMPTS_EXHAUSTED' };
      await setState(id, exhausted);
      return exhausted;
    }
    const attempts = Number(state.attempts || 0) + 1;
    const attemptedAt = new Date(now()).toISOString();
    const sending = { ...state, provider: 'formsubmit', status: 'sending', attempts, attemptedAt, deliveryConfirmed: false };
    const stillPresent = await setState(id, sending);
    if (!stillPresent) return;
    const response = await submitToFormSubmit(record, { emailTo: state.to || emailTo, siteUrl, fetchImpl, timeoutMs });
    const status = response.status === 'retry' && attempts >= MAX_ATTEMPTS ? 'failed' : response.status;
    const result = { ...sending, ...response, status, updatedAt: new Date(now()).toISOString() };
    delete result.nextAttemptAt;
    if (status === 'retry') result.nextAttemptAt = new Date(now() + RETRY_DELAYS[Math.min(attempts - 1, RETRY_DELAYS.length - 1)]).toISOString();
    await setState(id, result);
    return result;
  }

  function schedule(id) {
    if (!emailTo || stopped) return Promise.resolve();
    const task = queue.catch(() => {}).then(() => attempt(id));
    // Only a non-sensitive error code reaches server logs.
    queue = task.catch((error) => console.error('Inquiry email processing failed:', error.code || 'STORE_ERROR'));
    return queue;
  }

  async function drain() {
    if (!emailTo || stopped) return;
    const candidates = (await snapshot()).filter((record) => {
      const state = record.emailForwarding;
      return state && !FINAL.has(state.status) && (!state.nextAttemptAt || Date.parse(state.nextAttemptAt) <= now());
    });
    for (const record of candidates.slice(0, 10)) {
      if (stopped) break;
      await schedule(record.id);
    }
  }

  if (emailTo && intervalMs > 0) {
    timer = setInterval(() => { drain().catch((error) => console.error('Inquiry email queue unavailable:', error.code || 'STORE_ERROR')); }, intervalMs);
    timer.unref();
  }
  return {
    initialState: () => emailTo ? { provider: 'formsubmit', to: emailTo, status: 'pending', attempts: 0, deliveryConfirmed: false } : undefined,
    schedule, drain, pending: () => queue,
    stop: () => { stopped = true; if (timer) clearInterval(timer); },
  };
}
