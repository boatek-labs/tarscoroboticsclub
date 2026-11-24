(()=>{'use strict';
if(window.__TRC_MOTION_SYSTEM__)return;window.__TRC_MOTION_SYSTEM__=true;
const d=document,b=d.body;if(!b)return;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
b.classList.add('trc-motion-page-enter');
const progress=d.createElement('div');progress.className='trc-motion-progress';progress.setAttribute('aria-hidden','true');b.appendChild(progress);
const orb=d.createElement('div');orb.className='trc-motion-orb';orb.setAttribute('aria-hidden','true');b.appendChild(orb);
const sceneSelector='main>section,main section,body>section,#hero,#about,#pillars,#modules,#projects,#events,#community,#contact';
const scenes=[...new Set(d.querySelectorAll(sceneSelector))].filter(el=>!el.closest('header,nav,footer')&&!el.closest('[data-no-motion]'));
scenes.forEach((el,i)=>{el.classList.add('trc-motion-scene');el.style.setProperty('--scene-x',i%2?'28%':'72%');el.style.setProperty('--scene-y',i%2?'24%':'18%');const title=el.querySelector('h1,h2,h3');if(title)title.classList.add('trc-motion-scene-title')});
const revealSelector='.trc-card,.card,.stat-card,.module-card,.project-card,.event-card,.member-card,.notification-card,.panel,.profile-card,.dashboard-card,.workspace-panel,article,.page-header,.page-content,.form-wrap,.home-hero-copy,.home-hero-mark,.trc-home-hero,#main,#content,#left,#right';
const reveals=[...d.querySelectorAll(revealSelector)].filter(el=>!el.closest('header,nav,footer,[data-no-motion]'));
reveals.forEach(el=>{el.dataset.motion='reveal';if(el.matches('.trc-card,.card,.stat-card,.module-card,.project-card,.event-card,.member-card,.notification-card,.dashboard-card,article'))el.classList.add('trc-motion-card')});
const staggerTargets=[...d.querySelectorAll('.grid,.grid-cols-2,.grid-cols-3,.grid-cols-4,.flex.flex-wrap')].filter(el=>el.children.length>1&&el.children.length<13&&!el.closest('nav'));
staggerTargets.forEach(el=>el.classList.add('trc-motion-stagger'));
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -5% 0px'});
b.classList.add('trc-motion-ready');[...reveals,...staggerTargets].forEach(el=>observer.observe(el));
d.querySelectorAll('button,a[role="button"],.btn,.button,.home-btn,input[type="submit"]').forEach(el=>el.classList.add('trc-motion-button'));
let raf=0;function update(){
 const vh=innerHeight||1,scroll=scrollY,max=d.documentElement.scrollHeight-vh;
 progress.style.transform='scaleX('+(max>0?scroll/max:0)+')';
 scenes.forEach(el=>{const r=el.getBoundingClientRect(),center=r.top+r.height/2;const p=Math.max(-1,Math.min(1,(center-vh/2)/(vh*.95)));el.style.setProperty('--scene-progress',p.toFixed(3));el.style.setProperty('--scene-near',(1-Math.min(1,Math.abs(p))).toFixed(3))});
 raf=0;
}
function schedule(){if(!raf)raf=requestAnimationFrame(update)}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});update();
if(fine)addEventListener('pointermove',e=>{orb.style.setProperty('--mx',e.clientX+'px');orb.style.setProperty('--my',e.clientY+'px');const card=e.target.closest('.trc-motion-card');if(card){const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.setProperty('--tilt-x',(x*3.2).toFixed(2)+'deg');card.style.setProperty('--tilt-y',(-y*3.2).toFixed(2)+'deg')}},{passive:true});
d.addEventListener('pointerleave',e=>{const card=e.target.closest?.('.trc-motion-card');if(card){card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')}},true);
d.addEventListener('pointerdown',e=>{const el=e.target.closest('.trc-motion-card,.trc-motion-button');if(!el)return;el.classList.add('is-pressed');if(el.classList.contains('trc-motion-button')){const r=el.getBoundingClientRect(),rip=d.createElement('i');rip.className='trc-motion-ripple';rip.style.left=(e.clientX-r.left)+'px';rip.style.top=(e.clientY-r.top)+'px';el.appendChild(rip);setTimeout(()=>rip.remove(),700)}},{passive:true});
['pointerup','pointercancel'].forEach(type=>d.addEventListener(type,()=>d.querySelectorAll('.is-pressed').forEach(el=>el.classList.remove('is-pressed')),{passive:true}));
d.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const target=d.querySelector(a.getAttribute('href'));if(!target)return;e.preventDefault();const from=a.getBoundingClientRect(),ghost=a.cloneNode(true),cs=getComputedStyle(a);ghost.classList.add('trc-motion-ghost');Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',borderRadius:cs.borderRadius,background:cs.backgroundColor,color:cs.color,border:cs.border,display:'flex',alignItems:'center',justifyContent:'center',font:cs.font,whiteSpace:'nowrap'});d.body.appendChild(ghost);const to=target.getBoundingClientRect();ghost.animate([{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',opacity:1,transform:'scale(1)'},{left:Math.max(8,to.left+Math.min(to.width,from.width)/2-from.width/2)+'px',top:Math.max(8,to.top+scrollY+24)+'px',width:Math.max(64,Math.min(to.width,from.width*1.4))+'px',height:Math.max(36,Math.min(52,from.height))+'px',opacity:.12,transform:'scale(.92)'}],{duration:720,easing:'cubic-bezier(.2,.78,.22,1)',fill:'forwards'}).onfinish=()=>ghost.remove();target.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',a.getAttribute('href'))});
d.addEventListener('visibilitychange',()=>{if(!d.hidden)schedule()});
addEventListener('load',()=>{schedule();reveals.filter(el=>el.getBoundingClientRect().top<innerHeight*.92).forEach(el=>el.classList.add('is-visible'))},{once:true});
})();