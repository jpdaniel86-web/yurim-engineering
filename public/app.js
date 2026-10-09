(()=>{
 const header=document.querySelector('.site-header');const back=document.querySelector('.back-top');
 const tabs=document.querySelector('.subnav'),activeTab=tabs?.querySelector('.is-active');
 const centerActiveTab=()=>{if(tabs&&activeTab)tabs.scrollLeft=Math.max(0,activeTab.offsetLeft-(tabs.clientWidth-activeTab.offsetWidth)/2)};
 centerActiveTab();document.fonts?.ready.then(centerActiveTab);if(tabs&&activeTab&&'ResizeObserver' in window)new ResizeObserver(centerActiveTab).observe(tabs);
 const sectionNav=document.querySelector('.section-nav');
 const childButtons=[...document.querySelectorAll('.subnav-expand')];
 const setChildPanel=(button,open)=>{const panel=document.getElementById(button.getAttribute('aria-controls'));if(!panel)return;button.setAttribute('aria-expanded',String(open));panel.hidden=!open};
 childButtons.forEach(button=>button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';childButtons.forEach(other=>setChildPanel(other,other===button&&open))}));
 sectionNav?.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const button=childButtons.find(item=>item.getAttribute('aria-expanded')==='true');if(button){event.preventDefault();setChildPanel(button,false);button.focus()}});
 function onScroll(){header?.classList.toggle('scrolled',scrollY>50);if(back){const visible=scrollY>500;back.hidden=!visible;back.classList.toggle('visible',visible)}}onScroll();addEventListener('scroll',onScroll,{passive:true});back?.addEventListener('click',()=>{header?.querySelector('.brand')?.focus({preventScroll:true});scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})});
 const menu=document.querySelector('#full-menu'),toggle=document.querySelector('.menu-toggle'),close=document.querySelector('.menu-close');let lastFocus;
 const menuBackground=[...document.body.children].filter(element=>element!==menu&&element.tagName!=='SCRIPT');
 const previousInert=new Map();
 const setMenu=open=>{menu.hidden=!open;document.body.classList.toggle('menu-open',open);toggle.setAttribute('aria-expanded',String(open));if(open){lastFocus=document.activeElement;menuBackground.forEach(element=>{previousInert.set(element,element.inert);element.inert=true});close.focus()}else{menuBackground.forEach(element=>{element.inert=previousInert.get(element)??false});previousInert.clear();lastFocus?.focus()}};
 toggle?.addEventListener('click',()=>setMenu(menu.hidden));close?.addEventListener('click',()=>setMenu(false));document.addEventListener('keydown',ev=>{if(menu.hidden)return;if(ev.key==='Escape'){setMenu(false);return}if(ev.key==='Tab'){const focusable=[...menu.querySelectorAll('a,button')],first=focusable[0],last=focusable.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}}});
 document.querySelectorAll('.nav-item').forEach((item,index)=>{
  const trigger=item.querySelector(':scope>a'),panel=item.querySelector('.nav-dropdown');if(!panel)return;
  panel.id=`header-submenu-${index}`;trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
  const open=()=>{item.classList.remove('nav-dismissed');trigger.setAttribute('aria-expanded','true')};
  item.addEventListener('mouseenter',open);item.addEventListener('focusin',open);
  item.addEventListener('mouseleave',()=>{if(!item.contains(document.activeElement))trigger.setAttribute('aria-expanded','false')});
  item.addEventListener('focusout',()=>queueMicrotask(()=>{if(!item.contains(document.activeElement)){const hovered=item.matches(':hover');if(!hovered)item.classList.remove('nav-dismissed');trigger.setAttribute('aria-expanded',String(hovered&&!item.classList.contains('nav-dismissed')))}}));
  item.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();trigger.focus();item.classList.add('nav-dismissed');trigger.setAttribute('aria-expanded','false')}else if(event.key==='ArrowDown'&&event.target===trigger){event.preventDefault();open();panel.querySelector('a')?.focus()}});
 });
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!reduced&&'IntersectionObserver' in window){document.body.classList.add('js-ready');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}
 const video=document.querySelector('.hero-video');
 if(video){const shouldPlay=!reduced&&!navigator.connection?.saveData;if(shouldPlay)video.play().catch(()=>{});document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(shouldPlay)video.play().catch(()=>{})})}
 const grid=document.querySelector('.project-grid'),search=document.querySelector('#project-search');if(grid&&search){
  const filter=grid.dataset.filter,empty=document.querySelector('.empty-state'),emptyTitle=empty.querySelector('h2'),emptyCopy=empty.querySelector('p');
  const originalTitle=emptyTitle.textContent,originalCopy=emptyCopy.textContent;
  const results=document.createElement('p');results.className='sr-only';results.setAttribute('role','status');results.setAttribute('aria-live','polite');search.closest('.search-box').after(results);
  const reset=document.createElement('button');reset.type='button';reset.className='search-reset';reset.textContent='검색어 지우기';reset.hidden=true;empty.append(reset);
  function filterProjects(){const term=search.value.trim().toLowerCase();let count=0;grid.querySelectorAll('.project-card').forEach(card=>{const visible=(filter==='all'||filter===card.dataset.kind||filter===card.dataset.category)&&card.dataset.search.toLowerCase().includes(term);card.hidden=!visible;if(visible)count++});empty.hidden=count>0;empty.classList.toggle('search-empty',Boolean(term));grid.hidden=count===0;reset.hidden=!term;emptyTitle.textContent=term?'검색 결과가 없습니다.':originalTitle;emptyCopy.textContent=term?'다른 검색어로 찾아보거나 검색어를 지워 주세요.':originalCopy;results.textContent=term?`검색 결과 ${count}건`:''}
  filterProjects();search.addEventListener('input',filterProjects);reset.addEventListener('click',()=>{search.value='';filterProjects();search.focus()});
 }
 const form=document.querySelector('#inquiry-form');if(form){
  const status=document.querySelector('#form-status'),button=form.querySelector('button[type=submit]');
  const clearFieldError=field=>{const input=form.elements.namedItem(field);if(!input)return;const errorId=`inquiry-${field}-error`;document.getElementById(errorId)?.remove();input.removeAttribute('aria-invalid');const descriptions=(input.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==errorId);if(descriptions.length)input.setAttribute('aria-describedby',descriptions.join(' '));else input.removeAttribute('aria-describedby')};
  const showFieldErrors=errors=>{let first;Object.entries(errors).forEach(([field,message])=>{const input=form.elements.namedItem(field);if(!input||!input.id)return;clearFieldError(field);input.setAttribute('aria-invalid','true');const text=document.createElement('span');text.id=`inquiry-${field}-error`;text.className='field-error';text.textContent=message;input.closest('label').append(text);input.setAttribute('aria-describedby',[input.getAttribute('aria-describedby'),text.id].filter(Boolean).join(' '));first??=input});first?.focus()};
  form.addEventListener('input',event=>{if(event.target.name)clearFieldError(event.target.name)});
  form.querySelector('[aria-invalid="true"]')?.focus();
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(!form.reportValidity())return;
   ['name','company','phone','message','consent'].forEach(clearFieldError);form.querySelector('.form-errors')?.remove();
   const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;
   const phone=data.phone.trim(),digits=phone.replace(/\D/g,'');
   if(digits.length<7||digits.length>15||phone.length>30||!/^[+\d\s().-]+$/u.test(phone)){showFieldErrors({phone:'연락 가능한 전화번호를 입력해 주세요.'});status.className='error';status.textContent='연락처를 확인해 주세요.';return}
   button.disabled=true;status.className='';status.textContent='문의 내용을 접수하고 있습니다.';
   try{
    const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();
    if(!response.ok||!result.ok){if(result.errors)showFieldErrors(result.errors);const details=result.errors&&Object.values(result.errors).join(' ');throw new Error(details||result.message||result.error||'접수하지 못했습니다. 잠시 후 다시 시도해 주세요.')}
    status.className='success';status.textContent=`문의가 접수되었습니다. 접수번호: ${result.id}. 빠른 상담은 031-774-8358로 연락해 주세요.`;form.reset();['name','company','phone','message','website'].forEach(field=>{form.elements.namedItem(field).value=''});form.elements.consent.checked=false;
   }catch(error){status.className='error';status.textContent=error.message||'접수하지 못했습니다. 대표전화로 문의해 주세요.'}finally{button.disabled=false}
  });
 }
})();
