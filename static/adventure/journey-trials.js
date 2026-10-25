'use strict';
(()=>{
 const root=document.getElementById('stageEncounter'),M=window.MociCampaignMap,P=window.WordMasterAnswerPolicy;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normalize=s=>String(s||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
 const shuffle=rows=>{const a=[...rows];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 let context=null,data=null,loading=false,request=0,session=null,notice='';
 const key=()=>data?'moci-trail-stamps-v1:'+data.instanceId:'';
 const stamps=()=>{try{const ids=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(ids)?ids.filter(n=>Number.isInteger(n)&&n>0&&n<14):[];}catch{return [];}};
 function render(stage,allowed,preview=false){context={stage,allowed,preview};if(session?.stage!==stage.id)session=null;paint();}
 function paint(){
  if(!context)return;const {stage,allowed,preview}=context,r=M.region(stage.id);
  if(!allowed||stage.boss){root.innerHTML='';return;}
  if(!session){root.innerHTML=`<div class="encounter-invitation"><small>ROADSIDE ENCOUNTER · 沿途小憩</small><button id="beginTrailTrial" type="button">${esc(r.trial)} <span aria-hidden="true">↗</span></button><p>${r.words} 词小挑战 · ${r.mode==='meaning'?'辨认词义':r.mode==='mixed'?'词义与默写交替':'合上词袋默写'}<br>只考已学词，可随时离开，不增加今日任务。</p>${data&&stamps().includes(stage.id)?'<span class="encounter-stamp">✧ 这一程，已留下一枚路印</span>':''}${notice?`<p role="status">${esc(notice)}</p>`:''}</div>`;document.getElementById('beginTrailTrial').disabled=loading;document.getElementById('beginTrailTrial').onclick=start;return;}
  if(session.complete){root.innerHTML=`<div class="trail-question"><small>${esc(r.trial)} · 已完成</small><h3>记忆回应了你。</h3><p>${context.preview?'预演练习不记录路印。':notice||'一枚小小的路印，留在这一程。'}<br>这场小憩不会代替今日学习，也不会提前通关。</p><button id="closeTrailTrial" type="button">收起词笺</button></div>`;document.getElementById('closeTrailTrial').onclick=close;return;}
  const q=session.words[session.index],mode=r.mode==='mixed'?(session.index%2?'spelling':'meaning'):r.mode;
  root.innerHTML=`<div class="trail-question"><small>${esc(r.trial)} · ${session.index+1} / ${session.words.length}</small><h3>${esc(mode==='meaning'?q.answer:q.meaning)}</h3>${session.wrong?`<p role="status">再记一遍：${esc(q.answer)} · ${esc(q.meaning)}</p><button id="retryTrailWord" type="button">合上词笺，再试一次</button>`:mode==='meaning'?`<div class="trail-options">${shuffle(q.choices).map((a,i)=>`<button type="button" data-trail-choice="${i}" data-meaning="${esc(a)}">${esc(a)}</button>`).join('')}</div>`:'<form id="trailForm"><input id="trailAnswer" aria-label="沿途英文默写" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="submit">落笔</button></form>'}<button id="closeTrailTrial" class="trail-close" type="button">先收起，不耽误赶路</button></div>`;
  document.getElementById('closeTrailTrial').onclick=close;
  document.getElementById('retryTrailWord')?.addEventListener('click',()=>{session.wrong=false;paint();});
  root.querySelectorAll('[data-trail-choice]').forEach(b=>b.onclick=()=>answer(b.dataset.meaning));
  document.getElementById('trailForm')?.addEventListener('submit',e=>{e.preventDefault();answer(document.getElementById('trailAnswer').value);});
  document.getElementById('trailAnswer')?.focus({preventScroll:true});
 }
 async function start(){
  if(loading||!context?.allowed)return;const stage=context.stage.id,id=++request;loading=true;notice='';paint();
  try{if(!data){const response=await fetch('/api/adventure/pool',{cache:'no-store'});if(!response.ok)throw Error();const value=await response.json();if(!Array.isArray(value.words)||!value.instanceId)throw Error();data=value;}
   if(id!==request||context.stage.id!==stage)return;
   const words=shuffle(data.words).slice(0,M.region(stage).words);if(!words.length){notice='词袋还很轻，先完成一些日常学习再来。';return;}
   session={stage,words,index:0,wrong:false,complete:false};
  }catch{notice='词袋暂时没打开，可以稍后再试。';}finally{loading=false;paint();}
 }
 function answer(value){if(!session||session.complete||session.wrong||!value.trim())return;const q=session.words[session.index],r=M.region(session.stage),mode=r.mode==='mixed'?(session.index%2?'spelling':'meaning'):r.mode;
  const matches=w=>{const policy=w.answer_policy?P?.bound(w.answer_policy,w.answer):null;return w.answer_policy?Boolean(policy&&P.grade(policy,value)):normalize(value)===normalize(w.answer);};
  const correct=mode==='meaning'?value===q.meaning:data.words.filter(w=>w.meaning===q.meaning&&w.pos===q.pos).some(matches);
  if(!correct){session.wrong=true;paint();return;}
  session.index++;if(session.index===session.words.length){session.complete=true;if(!context.preview)try{localStorage.setItem(key(),JSON.stringify([...new Set([...stamps(),session.stage])].sort((a,b)=>a-b)));}catch{notice='练习已完成，但浏览器未能保存这枚路印。';}}
  paint();
 }
 function close(){++request;session=null;notice='';paint();}
 window.MociTrailTrials={render};
})();
