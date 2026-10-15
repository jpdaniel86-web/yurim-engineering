import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects, services, tech } from '../src/content.mjs';
import { renderPage } from '../src/render.mjs';

const construction = projects.filter(project => project.category === '건설');
const expectedCounts = { pipeline:11, concrete:3, auger:11 };
const expectedYears = { 2016:2, 2018:2, 2019:1, 2021:1, 2023:8, 2024:7, 2025:2, 2026:2 };
const mainHTML = html => html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
const escaped = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

test('the construction archive contains all 25 records with the requested field and year distribution', () => {
  assert.equal(construction.length, 25);
  assert.deepEqual(Object.fromEntries(Object.keys(expectedCounts).map(kind => [kind, construction.filter(project => project.kind === kind).length])), expectedCounts);
  const byYear = {};
  for (const project of construction) {
    assert.ok(Number.isInteger(project.year), project.id);
    byYear[project.year] = (byYear[project.year] || 0) + 1;
    assert.equal(typeof project.ongoing, 'boolean', project.id);
    assert.ok(Array.isArray(project.specifications), project.id);
    assert.ok(project.specifications.every(item => Array.isArray(item) && item.length === 2 && item.every(value => typeof value === 'string')), project.id);
  }
  assert.deepEqual(byYear, expectedYears);
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
});

test('the recorded diameters, distances and temporary-shaft dimensions retain their supplied values', () => {
  const record = id => construction.find(project => project.id === id);
  assert.deepEqual(record('ulsan-bancheon-auger-2016').specifications, [
    ['강관 압입','1,000mm · 32m, 28m'],
    ['추진기지 가시설','8m × 4.5m × 6m · 2개소']
  ]);
  assert.deepEqual(record('cheongdo-iseo-auger-2016').specifications, [
    ['강관 압입','800mm · 89m'],
    ['추진기지 가시설','11m × 4.5m × 4.5m · 1개소'],
    ['도달기지 가시설','6m × 4m × 4.5m · 1개소']
  ]);
  assert.deepEqual(record('daegu-industrial-auger-2019').specifications, [
    ['강관 압입','1,000mm · 42m'],
    ['추진기지 가시설','11m × 4.5m × 10.2m · 1개소'],
    ['도달기지 가시설','6m × 4m × 10m · 1개소']
  ]);
  assert.deepEqual(record('uiseong-dain-auger-2024').specifications, [
    ['강관 압입','800mm · 32m / 800mm · 24m'],
    ['추진기지 가시설','11.4m × 4.5m × 8m · 1개소'],
    ['도달기지 가시설','4.5m × 6m × 8m · 1개소']
  ]);
  assert.deepEqual(record('yecheon-wolo-auger-2024').specifications.at(-1), ['도달기지 가시설','4.5m × 6m × 7.5m · 1개소']);
});

test('only the explicitly ongoing Gyeongbuk project is marked ongoing, without invented completion claims', () => {
  assert.deepEqual(construction.filter(project => project.ongoing).map(project => project.id), ['gyeongbuk-newtown-auger-2026']);
  const ongoing = construction.find(project => project.id === 'gyeongbuk-newtown-auger-2026');
  assert.equal(ongoing.year, 2026);
  assert.equal(ongoing.status, '진행 중');
  assert.deepEqual(ongoing.specifications, []);
  assert.match(mainHTML(renderPage('/projects/'+ongoing.id).html), /진행 중/);
  for (const project of construction) {
    assert.doesNotMatch(project.status + ' ' + project.desc, /준공|준공 완료|공사 완료/, project.id);
  }
  assert.equal(construction.find(project => project.id === 'bongseong-drainage-2026').status, '공사실적');
});

test('only the two explicitly named clients appear as clients in construction details', () => {
  const clients = construction.filter(project => project.client);
  assert.deepEqual(clients.map(project => [project.id, project.client]), [
    ['daepyeong-reservoir-2023','한국농어촌공사 경기지역본부 양평.광주.서울지사'],
    ['damun-drainage-2024','한성건영 주식회사']
  ]);
  for (const project of construction) {
    const html = mainHTML(renderPage('/projects/'+project.id).html);
    if (project.client) {
      assert.match(html, /<dt>발주처<\/dt>/, project.id);
      assert.ok(html.includes(escaped(project.client)), project.id);
    } else {
      assert.doesNotMatch(html, /<dt>발주처<\/dt>/, project.id);
    }
  }
});

test('every construction detail resolves and shows its supplied project facts without exposing the revision document', () => {
  for (const project of construction) {
    const result = renderPage('/projects/'+project.id);
    const html = mainHTML(result.html);
    assert.equal(result.status, 200, project.id);
    assert.ok(html.includes(escaped(project.title)), project.id);
    assert.ok(html.includes(escaped(project.location)), project.id);
    assert.match(html, new RegExp(`<dt>공사\\s*연도<\\/dt>\\s*<dd>${project.year}년<\\/dd>`), project.id);
    for (const [label,value] of project.specifications) {
      assert.ok(html.includes(escaped(label)), `${project.id}: ${label}`);
      assert.ok(html.includes(escaped(value)), `${project.id}: ${value}`);
    }
    assert.doesNotMatch(html, /유림엔지니어링 홈페이지 디자인 수정 요청서|제공자료|제공 자료/, project.id);
  }
});

test('each construction service links all of its own records, grouped by year, without mixing construction fields', () => {
  for (const [kind,count] of Object.entries(expectedCounts)) {
    const result = renderPage('/construction/'+kind);
    const html = mainHTML(result.html);
    assert.equal(result.status, 200);
    const own = construction.filter(project => project.kind === kind);
    assert.equal(own.length, count);
    for (const project of own) {
      assert.ok(html.includes(`href="/projects/${project.id}"`), `${kind}: ${project.id}`);
      assert.ok(html.includes(`${project.year}년`), `${kind}: ${project.year}`);
    }
    for (const project of construction.filter(project => project.kind !== kind)) {
      assert.ok(!html.includes(`href="/projects/${project.id}"`), `${kind} mixes ${project.id}`);
    }
  }
});

test('construction detail facts are escaped rather than interpreted as HTML', () => {
  const project = construction.find(item => item.id === 'cheongdo-iseo-auger-2016');
  const original = { title:project.title, desc:project.desc, location:project.location, specifications:project.specifications };
  const payload = '<img src=x onerror="alert(1)"> & \' "';
  try {
    project.title = payload;
    project.desc = payload;
    project.location = payload;
    project.client = payload;
    project.specifications = [[payload,payload]];
    const html = renderPage('/projects/'+project.id).html;
    assert.ok(!html.includes(payload));
    assert.ok(html.includes(escaped(payload)));
    assert.ok(!html.includes('<img src=x'));
  } finally {
    Object.assign(project, original);
    delete project.client;
  }
});

test('the auger service explains all five practical characteristics and the described machinery', () => {
  const service = services.find(item => item.path === '/construction/auger');
  assert.equal(service.title, '수평오거천공 압입공사');
  const html = mainHTML(renderPage(service.path).html);
  for (const text of ['확장형 잭해머','풍화암','초경암','천공','개착','도로','철도','하천']) {
    assert.ok(html.includes(text), text);
  }
  for (const label of ['다양한 지반 대응','효율적인 시공','경제성 향상','공기 단축','지중선로 구축']) {
    assert.ok(html.includes(label), label);
  }
  assert.equal(tech.find(item => item.slug === 'auger').points.length, 5);
});
