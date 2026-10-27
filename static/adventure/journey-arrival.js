'use strict';
(()=>{
 const R=window.MociCampaignRoute,M=window.MociCampaignMap,C=window.MociCampaignClues;
 const map=document.querySelector('.world-map'),sidebar=document.querySelector('.atlas-sidebar');
 const receipt=document.getElementById('arrivalReceipt'),banner=document.getElementById('arrivalBanner');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const lines=[
  '邮亭的灯已点亮。汝今日记下的言语，将随这封来信一道远行。',
  '落叶轻覆来路。汝从旧信中记起的字句，又添了一笔新的注脚。',
  '风车留在身后。明日循着水声前行，便能望见河湾。',
  '暮光落在芦苇间。汝已行至河湾，渡水的道路正在眼前。',
  '最后一块渡石已踏稳。河水带不走汝记住的言语，却送来了一件旧物。',
  '水声渐远，山径渐深。汝将今日所学收入词袋，继续向林地而行。',
  '残塔在林口守望。自此深入古林，愿汝记得来路，也听得懂回声。',
  '营火为汝留下一席。歇息片刻，听行路之人说一段雾中的传闻。',
  '遗祠的石阶已留有足印。那些失落的字，正一点一点被重新记起。',
  '山道回折，来时的河湾已在脚下。汝走过的每一程，都不曾白费。',
  '古门已在身后。高地的风掠过旧誓，似在等候汝读懂余下的文字。',
  '断渠尽头，灯火隐约可见。将今日的言语记牢，前路已不甚遥远。',
  '汝已来到临雾之崖。今夜暂歇，带上这封回信，明日再向桥头而行。'
 ];
 let active=null,frame=0,request=0;
 const text=(id,value)=>document.getElementById(id).textContent=value;
 function cleanup(){
  cancelAnimationFrame(frame);frame=0;
  document.querySelector('.arrival-route')?.remove();
  document.getElementById('traveler').style.removeProperty('visibility');
  document.getElementById('stagePins').inert=false;
  map.classList.remove('arrival-walking');banner.hidden=true;
 }
 function close({restore=true}={}){
  ++request;const current=active;active=null;cleanup();receipt.hidden=true;sidebar.classList.remove('showing-arrival');
  if(current&&!current.arrived&&restore)current.after();
 }
 function present(current){
  if(active!==current)return;
  cleanup();current.arrived=true;current.after();
  const stage=R.stages[current.data.stage-1],region=M.region(stage.id),clue=C.clues.find(c=>c.at===stage.id);
  text('arrivalEyebrow',current.data.preview?'ROUTE REHEARSAL · 路线预演':'A DAY ON THE ROAD · 今日抵达');
  text('arrivalTitle',stage.name);text('arrivalChapter',region.name+' / 第 '+String(stage.id).padStart(2,'0')+' 程');
  text('arrivalStory',lines[stage.id-1]);text('arrivalDate',current.data.preview?'演出预览 · 不计入真实旅程':current.data.day+' · '+current.data.book);
  text('arrivalNext',stage.id===13?'雾桥就在前方。明日，携所学之言再来。':'下一程 · '+R.stages[stage.id].name+'。明日再启程。');
  const scene=document.getElementById('arrivalScene');scene.style.backgroundPosition=stage.x+'% '+stage.y+'%';
  const letter=document.getElementById('arrivalClue');letter.hidden=!clue;letter.open=false;
  if(clue){text('arrivalClueTitle',clue.title);text('arrivalClueText',clue.text);}
  receipt.hidden=false;sidebar.classList.add('showing-arrival');
  if(innerWidth<=760&&!document.hidden)receipt.scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'});
  if(!document.hidden)document.getElementById('closeArrival').focus({preventScroll:true});
 }
 async function play(data,{before,after}){
  close();const id=++request,current={data,before,after,arrived:false};active=current;
  try{await document.querySelector('.world-art').decode();}catch{}
  if(id!==request||active!==current||current.arrived)return;
  if(reduced.matches||document.hidden||map.classList.contains('wind-paused')){present(current);return;}
  before();
  document.getElementById('stagePins').inert=true;
  document.getElementById('traveler').style.visibility='hidden';map.classList.add('arrival-walking');
  text('arrivalDestination','行至 · '+R.stages[data.stage-1].name);banner.hidden=false;
  const road=data.stage===1?'M55 587 Q70 563 100 540.3':M.legs[data.stage-2];
  const svg=document.getElementById('routeOverlay'),ns='http://www.w3.org/2000/svg',group=document.createElementNS(ns,'g');group.setAttribute('class','arrival-route');
  group.innerHTML='<path class="arrival-road" d="'+road+'"/><g class="arrival-wayfarer"><ellipse cy="3" rx="7" ry="2"/><path d="M-7 0-4-12Q0-17 4-12L7 0Z"/><circle cy="-16" r="3"/><path class="arrival-staff" d="M9 2 7-15"/></g>';
  svg.append(group);
  const path=group.querySelector('path'),walker=group.querySelector('g'),length=path.getTotalLength(),origin=path.getPointAtLength(0);path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length);walker.setAttribute('transform','translate('+origin.x+' '+origin.y+')');
  const land=document.querySelector('#knownLand g'),target=land?.lastElementChild,next=R.stages[data.stage];
  let frontier;
  if(land&&next){frontier=document.createElementNS(ns,'circle');frontier.setAttribute('cx',next.x*10);frontier.setAttribute('cy',next.y*6.67);frontier.setAttribute('r',0);frontier.setAttribute('fill','black');land.append(frontier);}
  const duration=data.stage===1?1900:2900,start=performance.now();
  function step(now){
   if(active!==current)return;
   const progress=Math.min(1,(now-start)/duration),eased=progress*progress*(3-2*progress),point=path.getPointAtLength(length*eased);
   walker.setAttribute('transform','translate('+point.x+' '+point.y+')');path.style.strokeDashoffset=String(length*(1-eased));
   const reveal=Math.max(0,(progress-.45)/.55);target?.setAttribute('r',String(96+14*reveal));frontier?.setAttribute('r',String(96*reveal));
   if(progress<1)frame=requestAnimationFrame(step);else present(current);
  }
  frame=requestAnimationFrame(step);
 }
 document.getElementById('skipArrival').addEventListener('click',()=>{if(active)present(active);});
 document.getElementById('closeArrival').addEventListener('click',()=>{close();document.getElementById('locateTraveler').focus({preventScroll:true});});
 // Navigating away never lets a late animation replace the new selection.
 document.addEventListener('click',e=>{if(e.target.closest('[data-atlas-panel],[data-stage],[data-list-stage],#previewToggle,#locateTraveler,#pauseMap'))close();},true);
 document.getElementById('previewDay').addEventListener('input',()=>close());
 document.getElementById('journeyBook').addEventListener('change',()=>close());
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){close();document.getElementById('locateTraveler').focus({preventScroll:true});}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!active.arrived)present(active);});
 reduced.addEventListener('change',()=>{if(reduced.matches&&active&&!active.arrived)present(active);});
 window.addEventListener('pagehide',()=>close({restore:false}));
 window.MociJourneyArrival={play,close};
})();
