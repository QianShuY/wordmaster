'use strict';
(()=>{
 const content=document.getElementById('endingContent');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let loading=false;
 async function load(returnFocus=false){
 if(loading)return;loading=true;content.setAttribute('aria-busy','true');
 const retry=document.getElementById('retryEnding');if(retry){retry.disabled=true;retry.textContent='正在读取……';}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch('/api/adventure/ending',{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error();
  const payload=await response.json();if(!payload||!Object.hasOwn(payload,'ending'))throw new Error();
  const {ending}=payload;
  if(ending!==null&&(!ending||typeof ending.title!=='string'||typeof ending.memorial!=='string'||typeof ending.completedAt!=='string'||!Array.isArray(ending.paragraphs)||!ending.paragraphs.length||!ending.paragraphs.every(p=>typeof p==='string')||!ending.summary||!['answered','correct'].every(k=>Number.isSafeInteger(ending.summary[k])&&ending.summary[k]>=0)||typeof ending.summary.revived!=='boolean'))throw new Error();
  if(!ending){content.innerHTML='<article class="ending-letter"><p class="letter-eyebrow">尚未落款的来信</p><h1>桥的彼岸，仍藏在雾里。</h1><p>沿着每日旅程走到雾桥，完成正式挑战后，这封信才会展开。</p><a class="ending-action" href="journey.html">继续我的旅程 →</a></article>';return;}
  content.innerHTML=`<article class="ending-letter"><p class="letter-eyebrow">第一章 · 雾桥来信 / CHAPTER COMPLETE</p><h1>${esc(ending.title)}</h1><div class="letter-rule"></div><div class="letter-body">${ending.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div><footer class="letter-signature"><span>致不曾停步的旅人</span><small>首通落款 · ${esc(ending.completedAt)}</small></footer><a class="ending-action" href="/#/adventure">收好来信，返回旅程 →</a></article><aside class="memorial-page" aria-label="章节纪念收藏"><p class="letter-eyebrow">我的旅程收藏 / 01</p><div class="memorial-seal" aria-hidden="true"><span>渡<br>雾</span></div><h2>${esc(ending.memorial)}</h2><p>以记忆为灯，以言语为桥。</p><span class="collected-label">已收入旅程手账</span><dl><div><dt>首通作答</dt><dd>${ending.summary.answered} 次</dd></div><div><dt>记起咒语</dt><dd>${ending.summary.correct} 次</dd></div><div><dt>复起宣言</dt><dd>${ending.summary.revived?'曾在桥上响起':'未曾倒下'}</dd></div></dl><p class="memorial-note">此印只在第一章首通时收藏一次。来信可随时重读，后续挑战不会覆盖这一页落款。</p><a href="battle.html">回到雾桥，再试咒语 ↗</a></aside>`;
 }catch{content.innerHTML='<article class="ending-letter"><h1>来信暂时未能展开。</h1><p>请检查连接后重试。重新读取不会重新结算挑战。</p><button class="ending-action" id="retryEnding">重新读取</button></article>';document.getElementById('retryEnding').onclick=()=>load(true);}
 finally{clearTimeout(timer);loading=false;content.setAttribute('aria-busy','false');if(returnFocus&&(document.activeElement===document.body||document.activeElement===retry)){const target=document.getElementById('retryEnding')||content.querySelector('h1');if(target){if(target.tagName==='H1')target.tabIndex=-1;target.focus();}}}
 }
 load();
})();
