import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPage, renderInquiryResponse } from '../src/render.mjs';

test('a contact form has a safe native POST path when JavaScript is unavailable',()=>{
 for(const type of ['construction','management','iot']){
  const html=renderPage('/contact/'+type).html;
  assert.match(html,/<form[^>]+method="post" action="\/api\/inquiries"/);
  assert.match(html,new RegExp(`name="type" value="${type}"`));
 }
});

test('a rejected inquiry preserves escaped fields and identifies the field to correct',()=>{
 const result=renderInquiryResponse({
  status:422,message:'입력 내용을 확인해 주세요.',errors:{phone:'연락 가능한 전화번호를 입력해 주세요.'},
  values:{type:'iot',name:'김&유림',company:'회사 "유림"',phone:'12',message:'</textarea><script>bad()</script>',consent:true},
 });
 assert.equal(result.status,422);
 assert.match(result.html,/name="type" value="iot"/);
 assert.match(result.html,/value="김&amp;유림"/);
 assert.match(result.html,/value="회사 &quot;유림&quot;"/);
 assert.match(result.html,/href="#inquiry-phone"/);
 assert.match(result.html,/id="inquiry-phone"[^>]+aria-invalid="true" aria-describedby="inquiry-phone-error"/);
 assert.match(result.html,/id="inquiry-phone-error">연락 가능한 전화번호/);
 assert.match(result.html,/name="consent" required checked/);
 assert.match(result.html,/&lt;\/textarea&gt;&lt;script&gt;bad\(\)&lt;\/script&gt;/);
 assert.doesNotMatch(result.html,/<script>bad\(\)<\/script>/);
});

test('accepted inquiry HTML confirms storage without claiming email delivery',()=>{
 const result=renderInquiryResponse({status:201,id:'test-inquiry-id',values:{type:'management'},emailForwarding:{status:'pending',deliveryConfirmed:false}});
 assert.equal(result.status,201);
 assert.match(result.html,/문의가 접수되었습니다/);
 assert.match(result.html,/test-inquiry-id/);
 assert.match(result.html,/href="\/contact\/management"/);
 assert.doesNotMatch(result.html,/<form[^>]+id="inquiry-form"/);
 assert.doesNotMatch(result.html,/이메일이 (전달|발송)되었습니다|메일 수신 완료/);
});

test('mobile whole-menu overlay has a named modal semantic',()=>{
 assert.match(renderPage('/environment/iot').html,/<div id="full-menu"[^>]+role="dialog" aria-modal="true" aria-label="전체 메뉴" hidden>/);
});

test('bottom inquiry actions preserve the current service context',()=>{
 for(const [path,type] of [
  ['/environment/iot','iot'],['/technology/iot','iot'],
  ['/environment/management','management'],['/projects/management','management'],
  ['/construction/auger','construction'],
 ]){
  const band=renderPage(path).html.match(/<section class="contact-band">[\s\S]*?<\/section>/)[0];
  assert.match(band,new RegExp(`href="/contact/${type}"`));
 }
});

test('back-to-top is excluded from initial hidden-screen keyboard navigation',()=>{
 assert.match(renderPage('/environment/iot').html,/<button class="back-top" aria-label="맨 위로" hidden>/);
});
