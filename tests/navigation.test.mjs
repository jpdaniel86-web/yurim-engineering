import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/render.mjs';

function sectionNavigation(path){
 return renderPage(path).html.match(/<nav class="section-nav"[\s\S]*?<\/nav>/)?.[0];
}
function visibleProjectKinds(path){
 const html=renderPage(path).html;
 return [...html.matchAll(/<a\b[^>]*\bclass="([^"]*)"[^>]*>/g)]
  .filter(([tag,classes])=>classes.split(/\s+/).includes('project-card')&&!/(?:\s)hidden(?:\s|>)/.test(tag))
  .map(([tag])=>tag.match(/data-kind="([^"]+)"/)?.[1]);
}

test('IoT is a facility-management child, outside the three primary environment tabs',()=>{
 const html=sectionNavigation('/environment/iot');
 const primary=html.match(/<ul class="subnav">[\s\S]*?<\/ul>/)[0];
 assert.equal([...primary.matchAll(/<li class="subnav-item /g)].length,3);
 assert.match(primary,/<a href="\/environment\/management" class="active" aria-current="true">/);
 assert.doesNotMatch(primary,/href="\/environment\/iot"/);
 assert.match(html,/<ul aria-label="개인하수처리시설 관리 하위 메뉴"><li><a href="\/environment\/iot" aria-current="page">/);
});

test('all three construction fields remain primary tabs',()=>{
 const html=sectionNavigation('/construction/auger');
 const primary=html.match(/<ul class="subnav">[\s\S]*?<\/ul>/)[0];
 assert.equal([...primary.matchAll(/<li class="subnav-item /g)].length,3);
 for(const slug of ['pipeline','concrete','auger'])assert.match(primary,new RegExp(`href="/construction/${slug}"`));
 assert.match(primary,/<a href="\/construction\/auger" class="active" aria-current="page">/);
});

test('project fields show only matching records before JavaScript runs',()=>{
 assert.deepEqual(visibleProjectKinds('/projects/water'),['water']);
 assert.deepEqual(visibleProjectKinds('/projects/odor'),['odor','odor','odor']);
 for(const [slug,count] of [['pipeline',11],['concrete',3],['auger',11]]){
  assert.deepEqual(visibleProjectKinds('/projects/'+slug),Array(count).fill(slug));
 }
 const construction=visibleProjectKinds('/projects/construction');
 assert.equal(construction.length,25);
 assert.equal(construction.filter(kind=>kind==='pipeline').length,11);
 assert.equal(construction.filter(kind=>kind==='concrete').length,3);
 assert.equal(construction.filter(kind=>kind==='auger').length,11);
 assert.equal(visibleProjectKinds('/projects').length,29);
 assert.deepEqual(visibleProjectKinds('/projects/management'),[]);
 assert.match(renderPage('/projects/management').html,/<div class="empty-state" >/);
});

test('an empty facility-management archive directs inquiries to facility management',()=>{
 const html=renderPage('/projects/management').html;
 const state=html.match(/<div class="empty-state"[\s\S]*?<\/div>/)[0];
 assert.match(state,/href="\/contact\/management">시설관리 문의하기/);
 assert.doesNotMatch(state,/href="\/contact\/construction"/);
});

test('the default inquiry form selects the matching construction inquiry menu',()=>{
 const html=renderPage('/contact').html;
 assert.match(html,/<input type="hidden" name="type" value="construction">/);
 assert.match(sectionNavigation('/contact'),/<a href="\/contact\/construction" class="active" aria-current="page">/);
});

test('unknown descendants of valid detail pages return 404 instead of duplicating their content',()=>{
 for(const path of ['/projects/water/nope','/company/ceo/nope','/contact/iot/nope','/technology/water/nope']){
  assert.equal(renderPage(path).status,404,path);
 }
});

test('valid detail URLs continue to accept a single trailing slash',()=>{
 for(const path of ['/projects/water/','/company/ceo/','/contact/iot/','/technology/water/']){
  assert.equal(renderPage(path).status,200,path);
 }
});
