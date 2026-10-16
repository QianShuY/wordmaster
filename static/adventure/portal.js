'use strict';
(()=>{
 const status=document.getElementById('travelStatus');
 const clues=document.getElementById('clueJournal'),toggle=document.getElementById('openClues');
 toggle.addEventListener('click',()=>{clues.hidden=!clues.hidden;toggle.setAttribute('aria-expanded',String(!clues.hidden));if(!clues.hidden)clues.scrollIntoView({block:'nearest',behavior:'smooth'});});
 const art=document.querySelector('.departure-art');
 const warmArt=()=>{if(!art.getAttribute('src'))art.src=art.dataset.src;};
 document.querySelectorAll('[data-nav="adventure"]').forEach(link=>{
  link.addEventListener('pointerenter',warmArt,{once:true});
  link.addEventListener('focus',warmArt,{once:true});
 });
 let run=0;
 async function enter(){
  const token=++run;
  window.MociArrivalLetter.enter();
  warmArt();
 try{
  const response=await fetch('/api/adventure/campaign',{cache:'no-store'});
  if(!response.ok)throw new Error('unavailable');
  const state=await response.json();if(token!==run)return;
  const completed=Math.max(0,Math.min(14,Number(state.completed)||0));
  toggle.disabled=false;
  const found=window.MociCampaignClues.render(document.getElementById('portalClues'),completed);
  document.getElementById('clueCount').textContent=`翻阅线索 · ${found} / 5 已拾得`;
  const stage=window.MociCampaignRoute.stages[Math.max(0,Math.min(13,(Number(state.current)||1)-1))];
  document.getElementById('currentStop').textContent=state.todayCleared?'今日这一程，已写入手账':`第 ${stage.id} 关 · ${stage.name}`;
  status.textContent=state.chapterCleared?'第一章已落款，渡雾者之印已收入旅程手账。':state.todayCleared?'在这里歇一歇，明天继续向前。':state.bossAvailable?'雾桥已在前方。最后一封信，等你亲自拆开。':'完成今天的学习计划，再揭开下一段道路。';
  document.getElementById('travelCount').innerHTML=`${completed} <small>/ 14 关</small>`;
  const progress=document.getElementById('travelProgress');progress.setAttribute('aria-valuenow',String(completed));progress.firstElementChild.style.width=(completed/14*100)+'%';
  const link=document.getElementById('continueJourney');link.href=`/adventure/journey.html?stage=${stage.id}`;
  link.firstChild.textContent=state.chapterCleared?'重读雾桥来信 ':completed?'继续我的旅程 ':'从旧邮亭出发 ';if(state.chapterCleared)link.href='/adventure/ending.html';
 }catch{
  toggle.disabled=true;
  document.getElementById('clueCount').textContent='线索暂未读取';
  document.getElementById('currentStop').textContent='旅程手账暂未读取';
  status.textContent='可以先展开地图，稍后刷新重试。';
 }
 }
 window.MociAdventurePortal={enter};
})();
