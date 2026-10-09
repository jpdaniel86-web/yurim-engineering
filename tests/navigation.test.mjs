import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/render.mjs';

function sectionNavigation(path){
 return renderPage(path).html.match(/<nav class="section-nav"[\s\S]*?<\/nav>/)?.[0];
}
function visibleProjectKinds(path){
 const html=renderPage(path).html;
 return [...html.matchAll(/<a class="project-card"[^>]*>/g)]
  .filter(([tag])=>!/(?:\s)hidden(?:\s|>)/.test(tag))
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
 for(const slug of ['management','construction','pipeline','concrete','auger']){
  assert.deepEqual(visibleProjectKinds('/projects/'+slug),[]);
  assert.match(renderPage('/projects/'+slug).html,/<div class="empty-state" >/);
 }
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
