import { open } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readInquiryFile, updateInquiries, withInquiryLock } from '../lib/inquiry-store.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DAY = 24 * 60 * 60 * 1000;
const HELP = `문의 관리 (서버에 직접 접근할 수 있는 운영자용)
  node scripts/manage-inquiries.mjs list [--json] [--data-dir DIR]
  node scripts/manage-inquiries.mjs export --out FILE [--format csv|json] [--data-dir DIR]
  node scripts/manage-inquiries.mjs complete ID [--at ISO_DATE] [--data-dir DIR]
  node scripts/manage-inquiries.mjs delete ID [--data-dir DIR]
  node scripts/manage-inquiries.mjs prune [--completed-days 365] [--received-days DAYS] [--apply] [--data-dir DIR]
prune은 기본적으로 삭제할 접수번호만 미리 보여 주며 --apply를 붙이면 삭제합니다.
기본 목록에는 연락처/문의 내용이 포함되지 않습니다. export 파일은 개인정보를 포함합니다.`;

export function csvCell(value) {
  let text = String(value ?? '');
  // Excel interprets these prefixes as formulas even when a CSV field is quoted.
  if (/^[\s]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(records) {
  const keys = ['id', 'receivedAt', 'type', 'name', 'company', 'phone', 'message', 'consent', 'completedAt', 'privacyVersion'];
  return '\ufeff' + [keys.map(csvCell).join(','), ...records.map((record) => keys.map((key) => csvCell(record[key])).join(','))].join('\r\n') + '\r\n';
}

export function selectExpired(records, { completedDays = 365, receivedDays, now = Date.now() } = {}) {
  const cutoff = now - completedDays * DAY;
  return records.filter((record) => {
    const completed = Date.parse(record.completedAt || '');
    if (Number.isFinite(completed) && completed <= cutoff) return true;
    return receivedDays !== undefined && Date.parse(record.receivedAt) <= now - receivedDays * DAY;
  });
}

function parseArguments(argv) {
  const positional = [];
  const flags = {};
  const valued = new Set(['data-dir', 'out', 'format', 'at', 'completed-days', 'received-days']);
  const switches = new Set(['json', 'apply', 'help']);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    const name = arg.slice(2);
    if (switches.has(name)) flags[name] = true;
    else if (valued.has(name) && argv[i + 1] && !argv[i + 1].startsWith('--')) flags[name] = argv[++i];
    else throw new Error('지원하지 않거나 값이 없는 옵션입니다. --help를 확인해 주세요.');
  }
  return { positional, flags };
}

function days(value, fallback) {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 36500) throw new Error('보관 기간은 1~36,500일이어야 합니다.');
  return Number(value);
}

export async function run(argv = process.argv.slice(2), output = (value) => console.log(value)) {
  const { positional, flags } = parseArguments(argv);
  const [command, id] = positional;
  if (!command || flags.help || command === 'help') { output(HELP); return; }
  if (!['list', 'export', 'complete', 'delete', 'prune'].includes(command) || positional.length > (['complete', 'delete'].includes(command) ? 2 : 1)) throw new Error('명령과 접수번호를 확인해 주세요. --help를 사용할 수 있습니다.');
  const dataDir = path.resolve(flags['data-dir'] || process.env.DATA_DIR || path.join(ROOT, 'data'));
  if (command === 'list') {
    const records = await withInquiryLock(dataDir, (storePath) => readInquiryFile(storePath));
    const summary = records.map(({ id, receivedAt, type, completedAt }) => ({ id, receivedAt, type, completedAt: completedAt || null }));
    output(flags.json ? JSON.stringify(summary, null, 2) : ['접수번호\t접수시각\t분야\t상담완료시각', ...summary.map((record) => [record.id, record.receivedAt, record.type, record.completedAt || '-'].join('\t'))].join('\n'));
    return;
  }
  if (command === 'export') {
    if (!flags.out) throw new Error('개인정보 내보내기 파일의 --out 경로를 지정해 주세요.');
    const format = flags.format || 'csv';
    if (!['csv', 'json'].includes(format)) throw new Error('내보내기 형식은 csv 또는 json입니다.');
    const destination = path.resolve(flags.out);
    const publicDir = path.join(ROOT, 'public');
    const relative = path.relative(publicDir, destination);
    if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) throw new Error('개인정보 파일을 공개 public 폴더에 저장할 수 없습니다.');
    const records = await withInquiryLock(dataDir, (storePath) => readInquiryFile(storePath));
    const handle = await open(destination, 'wx', 0o600);
    try { await handle.writeFile(format === 'csv' ? toCsv(records) : JSON.stringify(records, null, 2), 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    output(`${records.length}건을 지정 파일로 내보냈습니다. 기존 파일은 덮어쓰지 않습니다.`);
    return;
  }
  if (command === 'complete' || command === 'delete') {
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('올바른 접수번호를 지정해 주세요.');
    const timestamp = flags.at ? new Date(flags.at) : new Date();
    if (!Number.isFinite(timestamp.getTime()) || timestamp.getTime() > Date.now()) throw new Error('상담 완료 시각은 현재까지의 올바른 날짜여야 합니다.');
    const result = await updateInquiries(dataDir, (records) => {
      const target = records.find((record) => record.id === id);
      if (!target) throw new Error('해당 접수번호를 찾을 수 없습니다.');
      if (command === 'complete' && timestamp.getTime() < Date.parse(target.receivedAt)) throw new Error('상담 완료 시각은 접수 시각보다 앞설 수 없습니다.');
      return { records: command === 'delete' ? records.filter((record) => record.id !== id) : records.map((record) => record.id === id ? { ...record, completedAt: timestamp.toISOString() } : record), result: id };
    });
    output(`${result}: ${command === 'delete' ? '삭제했습니다.' : '상담 완료 시각을 기록했습니다.'}`);
    return;
  }
  const retention = { completedDays: days(flags['completed-days'], 365), receivedDays: days(flags['received-days'], undefined) };
  if (!flags.apply) {
    const records = await withInquiryLock(dataDir, (storePath) => readInquiryFile(storePath));
    const selected = selectExpired(records, retention);
    output(JSON.stringify({ preview: true, count: selected.length, ids: selected.map((record) => record.id), retention }, null, 2));
    return;
  }
  const result = await updateInquiries(dataDir, (records) => {
    const expired = new Set(selectExpired(records, retention).map((record) => record.id));
    return { records: records.filter((record) => !expired.has(record.id)), result: expired.size };
  });
  output(`보관 기준에 해당하는 ${result}건을 삭제했습니다.`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  run().catch((error) => {
    console.error(error.code === 'EEXIST' ? '내보내기 대상 파일이 이미 있습니다. 새 파일 이름을 지정해 주세요.' : error.message || '관리 작업에 실패했습니다.');
    process.exitCode = 1;
  });
}
