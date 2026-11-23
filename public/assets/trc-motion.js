(()=>{'use strict';
if(window.__TRC_MOTION_SYSTEM__)return;window.__TRC_MOTION_SYSTEM__=true;
const doc=document,body=doc.body;if(!body)return;
body.classList.add('trc-motion-page-enter');
const progress=doc.createElement('div');progress.className='trc-motion-progress';progress.setAttribute('aria-hidden','true');body.appendChild(progress);
const orb=doc.createElement('div');orb.className='trc-motion-orb';orb.setAttribute('aria-hidden','true');body.appendChild(orb);
let ticking=false;function updateScroll(){const max=doc.documentElement.scrollHeight-innerHeight;progress.style.transform='scaleX('+(max>0?scrollY/max:0)+')';ticking=false}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScroll);ticking=true}},{passive:true});updateScroll();
if(matchMedia('(pointer:fine)').matches){addEventListener('pointermove',e=>{orb.style.setProperty('--mx',e.clientX+'px');orb.style.setProperty('--my',e.clientY+'px')},{passive:true})}
const revealSelectors='main section, body>section, #main, #content, #left, #right, .form-wrap, .home-hero-copy, .home-hero-mark, .trc-home-hero, .page-header, .page-content, .trc-card, .card, .stat-card, .module-card, .project-card, .event-card, .member-card, .notification-card, .panel, .profile-card, .dashboard-card, article, .workspace-panel';
const candidates=[...doc.querySelectorAll(revealSelectors)].filter(el=>!el.closest('header,nav,footer')&&!el.matches('header,nav,footer')&&!el.closest('[data-no-motion]'));
candidates.forEach((el,i)=>{if(el.dataset.motion==='skip')return;el.dataset.motion='reveal';if(el.matches('.trc-card,.card,.stat-card,.module-card,.project-card,.event-card,.member-card,.notification-card,.dashboard-card'))el.classList.add('trc-motion-card');});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -7% 0px'});
body.classList.add('trc-motion-ready');candidates.forEach(el=>observer.observe(el));
doc.querySelectorAll('button,a[role="button"],.btn,.button,.home-btn').forEach(el=>{el.classList.add('trc-motion-button')});
const internalAnchor=e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href');if(!id||id==='#')return;const target=doc.querySelector(id);if(!target)return;e.preventDefault();const from=a.getBoundingClientRect(),to=target.getBoundingClientRect();if(from.width&&from.height){const ghost=a.cloneNode(true);ghost.classList.add('trc-motion-ghost');const cs=getComputedStyle(a);Object.assign(ghost.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',borderRadius:cs.borderRadius,background:cs.backgroundColor,color:cs.color,border:cs.border,display:'flex',alignItems:'center',justifyContent:'center',font:cs.font,whiteSpace:'nowrap'});doc.body.appendChild(ghost);const x=to.left+Math.min(to.width,from.width)/2-from.width/2,y=to.top+scrollY+Math.min(to.height,48)/2-from.height/2;ghost.animate([{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',opacity:1,transform:'scale(1)'},{left:Math.max(8,x)+'px',top:Math.max(8,y)+'px',width:Math.max(64,Math.min(to.width,from.width*1.35))+'px',height:Math.max(36,Math.min(52,from.height))+'px',opacity:.18,transform:'scale(.94)'}],{duration:680,easing:'cubic-bezier(.2,.78,.22,1)',fill:'forwards'}).onfinish=()=>ghost.remove()}
target.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',id)};
doc.addEventListener('click',internalAnchor);
doc.querySelectorAll('form button[type="submit"],form input[type="submit"]').forEach(el=>el.classList.add('trc-motion-button'));
doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)updateScroll()});
addEventListener('load',()=>{updateScroll();setTimeout(()=>{candidates.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('is-visible')})},120)},{once:true});
})();