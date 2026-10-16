'use strict';
(async()=>{
 const B=window.MociBossBattle,desk=document.getElementById('campPractice');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let words=[],mistakes=[],instanceId='',activity='words',spell='attack',filter='all',index=0,phase='read',result=null,loaded=false,loadError=false,declarationPhase='read',declarationKnown=false;
 const pool=()=>filter==='mistakes'?mistakes:words;
 const current=()=>pool()[index%Math.max(1,pool().length)];
 function bind(id,fn){document.getElementById(id)?.addEventListener('click',fn);}
 function form(fn){document.getElementById('campForm')?.addEventListener('submit',event=>{event.preventDefault();fn(document.getElementById('campAnswer').value);});}
 function message(text){document.getElementById('campMessage').textContent=text;}
 function render(){
  document.querySelectorAll('[data-activity]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.activity===activity)));
  if(activity==='declaration'){
   desk.innerHTML=`<p class="eyebrow">复起宣言 / 一句话的勇气</p><h3>我决不承认这样的结局。</h3><p>refuse to accept · 拒绝接受<br>this ending · 这样的结局</p>${declarationPhase==='read'?`<div class="declaration-paper">${B.DECLARATION}</div><p>先读一遍，再合上手账，试着把它完整写出来。</p><button id="recallDeclaration" class="camp-primary">合上手账，试着回忆 →</button>`:declarationPhase==='recall'?'<form id="campForm"><label for="campAnswer">输入英文宣言</label><input id="campAnswer" autocomplete="off" spellcheck="false" aria-label="营地复起宣言"><button class="camp-primary" type="submit">记住这句话</button></form><button id="readDeclaration" class="camp-quiet">再看一遍</button>':`<div class="camp-result">宣言已记下。进入战斗后，可以直接准备出发。</div><div class="declaration-paper">${B.DECLARATION}</div><a class="camp-primary" href="battle.html">带着这句话，前往雾桥 →</a><button id="recallDeclaration" class="camp-quiet">再练习一次</button><button id="restartDeclaration" class="camp-quiet">重新学习宣言</button>`}<p class="camp-message" id="campMessage"></p>`;
   bind('restartDeclaration',()=>{declarationKnown=false;declarationPhase='read';if(instanceId)try{localStorage.removeItem('moci-camp-declaration-v1:'+instanceId);}catch(e){}render();});bind('recallDeclaration',()=>{declarationPhase='recall';render();});bind('readDeclaration',()=>{declarationPhase='read';render();});
   form(value=>{if(B.normalize(value).replace(/[.!?。！？]+$/,'')===B.normalize(B.DECLARATION).replace(/[.!?。！？]+$/,'')){declarationKnown=true;declarationPhase='done';if(instanceId)try{localStorage.setItem('moci-camp-declaration-v1:'+instanceId,'learned');}catch(e){}render();}else message('再想一想 refuse to accept 的顺序。句末标点可以省略。');});
   return;
  }
  if(!loaded){desk.innerHTML='<p>正在翻开已学词袋……</p>';return;}
  if(loadError){desk.innerHTML='<h3>词袋暂时没有打开。</h3><p>无法获取已学词，请刷新页面重试。你仍可以先练习复起宣言。</p>';return;}
  const q=current();
  desk.innerHTML=`<div class="camp-tools"><div class="spell-tabs" aria-label="选择咒语练习">${Object.entries(B.spells).map(([key,s])=>`<button data-spell="${key}" aria-pressed="${key===spell}">${s.name}</button>`).join('')}</div><div class="pouch-filter"><button id="allWords" aria-pressed="${filter==='all'}">已学词 ${words.length}</button><button id="mistakeWords" ${mistakes.length?'':'disabled'} aria-pressed="${filter==='mistakes'}">本场错词 ${mistakes.length}</button></div></div><p class="spell-purpose">${esc(B.spells[spell].description)} · 营地练习</p><div id="wordPractice"></div><p class="camp-message" id="campMessage"></p>`;
  desk.querySelectorAll('[data-spell]').forEach(button=>button.addEventListener('click',()=>{spell=button.dataset.spell;phase='read';render();}));bind('allWords',()=>{filter='all';index=0;phase='read';render();});bind('mistakeWords',()=>{filter='mistakes';index=0;phase='read';render();});
  const body=document.getElementById('wordPractice');
  if(!q){body.innerHTML='<h3>词袋还很轻。</h3><p>先去今日手账认识一些词。营地只练习已有学习记录的内容。</p><a class="camp-primary" href="/#/">返回今日学习 →</a>';return;}
  if(phase==='read')body.innerHTML=`<div class="camp-word">${esc(q.answer)}</div><div class="camp-pos">${esc(q.pos)}${q.phonetic?` · /${esc(q.phonetic)}/`:''}</div><div class="camp-meaning">${esc(q.meaning)}</div><p>先看看这个词，下一步合上释义，再试着回忆。</p><button id="closePouch" class="camp-primary">${spell==='defend'?'合上释义，试着辨认':'合上词袋，试着默写'} →</button><button id="nextWord" class="camp-quiet">换一个词</button>`;
  else if(phase==='recall'){
   if(spell==='defend'){
    const options=[...q.choices];for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
    body.innerHTML=`<div class="camp-word">${esc(q.answer)}</div><p>选择正确的中文释义，练习展开护页。</p><div class="camp-options">${options.map((text,i)=>`<button data-option="${i}">${esc(text)}</button>`).join('')}</div><button id="peek" class="camp-quiet">想不起来，先看看</button>`;
    body.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>answer(options[Number(button.dataset.option)])));
   }else body.innerHTML=`<h3>记起英文，让咒语成形。</h3><div class="camp-meaning">${esc(q.meaning)}</div><div class="camp-pos">${esc(q.pos)}</div><form id="campForm"><label for="campAnswer">输入英文</label><input id="campAnswer" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="营地英文默写"><button type="submit" class="camp-primary">试着吟唱</button></form><button id="peek" class="camp-quiet">想不起来，先看看</button>`;
  }else body.innerHTML=`<div class="camp-result ${result.ok?'':'warmup'}">${result.ok?'这一次，记忆回应了你。':'再看一遍，给这个词多一点时间。'}</div><div class="camp-word">${esc(q.answer)}</div><div class="camp-meaning">${esc(q.meaning)}</div><button id="nextWord" class="camp-primary">再练一个 →</button><button id="retryWord" class="camp-quiet">这个词再温习一次</button>`;
  bind('closePouch',()=>{phase='recall';render();});bind('nextWord',()=>{index++;phase='read';render();});bind('retryWord',()=>{phase='read';render();});bind('peek',()=>{result={ok:false};phase='result';render();});form(answer);
 }
 function answer(value){if(phase!=='recall')return;if(!value.trim()){message('先写下你想起的英文，或选择先看看答案。');return;}const q=current();const ok=spell==='defend'?value===q.meaning:words.filter(w=>w.meaning===q.meaning&&w.pos===q.pos).some(w=>B.spellingMatches(value,w));result={ok};phase='result';render();}
 document.querySelectorAll('[data-activity]').forEach(button=>button.addEventListener('click',()=>{activity=button.dataset.activity;render();}));render();
 try{const response=await fetch('/api/adventure/pool',{cache:'no-store'});if(!response.ok)throw new Error('pool');const data=await response.json();words=data.words;instanceId=data.instanceId;try{const saved=JSON.parse(localStorage.getItem('moci-boss-battle-v1:'+instanceId)||'null');if(words.length>=10&&saved?.battle)mistakes=B.create(words,instanceId,saved.battle).mistakeWords();declarationKnown=localStorage.getItem('moci-camp-declaration-v1:'+instanceId)==='learned';}catch(e){}loaded=true;document.getElementById('pouchCount').textContent=`词袋 ${words.length} 个已学词 · 本场错词 ${mistakes.length} 个`;if(declarationKnown)declarationPhase='done';render();}
 catch(e){loaded=true;loadError=true;document.getElementById('pouchCount').textContent='词袋暂未打开';render();}
})();
