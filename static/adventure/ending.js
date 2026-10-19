'use strict';
(() => {
 const content = document.getElementById('endingContent');
 const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const duration = 14800;
 let loading = false, scene = null, score = null, frame = 0, elapsed = 0, lastTime = null, playing = false;
 function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0; lastTime = null;
 }
 function paint() {
  if (!scene) return;
  const act = elapsed < 4200 ? 'silence' : elapsed < 9000 ? 'voice' : elapsed < duration ? 'dawn' : 'rest';
  scene.dataset.act = act;
  scene.style.setProperty('--progress', String(Math.min(1, elapsed / duration)));
  document.getElementById('skipEnding').hidden = act === 'rest';
  document.getElementById('endingArrival').hidden = act !== 'rest';
  scene.classList.toggle('is-playing', playing && !document.hidden);
 }
 function tick(now) {
  frame = 0;
  if (!playing || document.hidden) return;
  if (lastTime !== null) elapsed = Math.min(duration, elapsed + now - lastTime);
  lastTime = now;
  if (elapsed >= duration) { playing = false; lastTime = null; score?.arrival(); }
  paint();
  if (playing) frame = requestAnimationFrame(tick);
 }
 function finish(focus = false) {
  score?.arrival(elapsed < duration);
  stop(); playing = false; elapsed = duration; paint();
  if (focus) document.getElementById('readEnding').focus();
 }
 function replay() {
  if (!scene) return;
  stop(); elapsed = 0; playing = !reduced.matches;
  scene.classList.remove('has-run');
  void scene.offsetWidth;
  scene.classList.add('has-run');
  document.getElementById('endingLetterView').hidden = true;
  content.classList.remove('reading-letter');
  scene.hidden = false;
  score?.restart();
  if (reduced.matches) { finish(true); return; }
  paint();
  document.getElementById('skipEnding').focus({preventScroll:true});
  if (!document.hidden) frame = requestAnimationFrame(tick);
 }
 function openLetter() {
  finish(); scene.hidden = true;
  document.getElementById('endingLetterView').hidden = false;
  content.classList.add('reading-letter');
  score?.read();
  document.getElementById('endingTitle').focus({preventScroll:true});
  window.scrollTo(0, 0);
 }
 function render(ending) {
  content.classList.add('has-ending');
  content.innerHTML = `
   <div class="ending-audio-controls"><button id="endingMusic" class="quiet-button" aria-pressed="false">♫ 开启配乐</button><input id="endingVolume" type="range" min="0" max="100" value="22" aria-label="结局配乐音量"><span id="endingAudioStatus" role="status"></span></div>
   <section class="ending-scene" id="endingScene" aria-label="雾桥之后 · 章节终幕" data-act="silence">
    <div class="ending-landscape" aria-hidden="true"></div><div class="ending-light" aria-hidden="true"></div><div class="ending-shade" aria-hidden="true"></div>
    <div class="ending-fog fog-far" aria-hidden="true"></div><div class="ending-fog fog-near" aria-hidden="true"></div>
    <div class="ending-dust" aria-hidden="true">${Array.from({length:9}, (_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>
    <div class="scene-overline"><span>墨词 · 旅行与咒语</span><span>第一章 / 终幕</span></div>
    <div class="ending-beat beat-silence"><span class="beat-kicker">THE LAST WORD</span><p>最后一个词，<br>落在了桥上。</p><span class="beat-footnote">石印松开。风声，渐渐远去。</span></div>
    <div class="ending-beat beat-voice"><span class="beat-kicker">THE KEEPER'S FAREWELL</span><p>“吾所看守的，<br>是那些被遗忘的言语。”</p><span class="beat-footnote">今日，你为它们重燃了灯火。</span></div>
    <div class="ending-beat beat-dawn"><span class="beat-kicker">CHAPTER I · COMPLETE</span><div class="ending-ornament" aria-hidden="true"><i></i><span>✧</span><i></i></div><h1>雾尽，桥开。</h1><p class="dawn-subtitle">${esc(ending.title)}</p><span class="dawn-line" aria-hidden="true"></span><span class="beat-footnote">以记忆为灯，以言语为桥。</span></div>
    <div class="ending-arrival" id="endingArrival" hidden><button class="read-letter" id="readEnding"><span class="letter-icon" aria-hidden="true">✉</span> 拆开彼岸的来信 <span aria-hidden="true">↗</span></button><span class="arrival-note">一枚渡雾者之印，已夹入你的手账。</span></div>
    <footer class="ending-scene-footer"><span class="chapter-coordinate">I <i></i> THE MIST BRIDGE</span><button id="skipEnding" class="quiet-button">跳过演出 <span aria-hidden="true">→</span></button><button id="replayEnding" class="quiet-button">重看终幕 <span aria-hidden="true">↺</span></button></footer>
    <div class="ending-progress" aria-hidden="true"><i></i></div>
   </section>
   <section id="endingLetterView" class="ending-letter-view" hidden aria-label="彼岸的来信与章节纪念">
    <div class="letter-navigation"><button class="quiet-button" id="backToScene">← 回望雾桥</button><span>LETTERS FROM THE OTHER SIDE</span></div>
    <div class="letter-spread"><article class="ending-letter"><p class="letter-eyebrow">第一章 · 雾桥来信 / 封存的回响</p><h1 id="endingTitle" tabindex="-1">${esc(ending.title)}</h1><div class="letter-rule"></div><div class="letter-body">${ending.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div><footer class="letter-signature"><span>致不曾停步的旅人</span><small>首通落款 · ${esc(ending.completedAt)}</small></footer><a class="ending-action" href="/#/adventure">收好来信，继续旅程 <span aria-hidden="true">→</span></a></article>
    <aside class="memorial-page" aria-label="章节纪念收藏"><p class="letter-eyebrow">JOURNEY RELIC / NO. 001</p><div class="memorial-seal" aria-hidden="true"><span>渡<br>雾</span></div><h2>${esc(ending.memorial)}</h2><p>你曾穿过雾，<br>也曾让遗忘的言语，再次有了回声。</p><span class="collected-label">已收入旅程手账</span><dl><div><dt>首通作答</dt><dd>${ending.summary.answered}<small> 次</small></dd></div><div><dt>记起咒语</dt><dd>${ending.summary.correct}<small> 次</small></dd></div><div><dt>复起宣言</dt><dd class="revival-record">${ending.summary.revived?'曾在桥上响起':'未曾倒下'}</dd></div></dl><p class="memorial-note">此印仅于第一章首通时收藏。<br>来信与落款，将一直留在这里。</p><a href="battle.html">再赴雾桥 ↗</a></aside></div>
   </section>`;
  scene = document.getElementById('endingScene');
  score = window.MociEndingAudio?.attach(document.getElementById('endingMusic'),document.getElementById('endingVolume'),replay);
  document.getElementById('skipEnding').onclick = () => finish(true);
  document.getElementById('replayEnding').onclick = replay;
  document.getElementById('readEnding').onclick = openLetter;
  document.getElementById('backToScene').onclick = () => {
   document.getElementById('endingLetterView').hidden = true; scene.hidden = false;
   content.classList.remove('reading-letter');
   score?.scene();
   document.getElementById('readEnding').focus({preventScroll:true}); window.scrollTo(0,0);
  };
  // Replaying only changes presentation. The server retains the first-clear record.
  replay();
 }
 async function load(returnFocus = false) {
  if (loading) return;
  loading = true; content.setAttribute('aria-busy','true');
  const retry = document.getElementById('retryEnding');
  if (retry) { retry.disabled = true; retry.textContent = '正在读取……'; }
  const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),10000);
  try {
   const response = await fetch('/api/adventure/ending',{cache:'no-store',signal:controller.signal});
   if (!response.ok) throw new Error();
   const payload = await response.json();
   if (!payload || !Object.hasOwn(payload,'ending')) throw new Error();
   const {ending} = payload;
   if (ending !== null && (!ending || typeof ending.title !== 'string' || typeof ending.memorial !== 'string' || typeof ending.completedAt !== 'string' || !Array.isArray(ending.paragraphs) || !ending.paragraphs.length || !ending.paragraphs.every(p=>typeof p==='string') || !ending.summary || !['answered','correct'].every(k=>Number.isSafeInteger(ending.summary[k])&&ending.summary[k]>=0) || typeof ending.summary.revived !== 'boolean')) throw new Error();
   if (!ending) {
    content.innerHTML = '<article class="ending-letter ending-message"><p class="letter-eyebrow">尚未落款的来信</p><h1>桥的彼岸，仍藏在雾里。</h1><p>沿着每日旅程走到雾桥，完成正式挑战后，这封信才会展开。</p><a class="ending-action" href="journey.html">继续我的旅程 →</a></article>';
   } else render(ending);
  } catch {
   content.innerHTML = '<article class="ending-letter ending-message"><h1>来信暂时未能展开。</h1><p>请检查连接后重试。重新读取不会重新结算挑战。</p><button class="ending-action" id="retryEnding">重新读取</button></article>';
   document.getElementById('retryEnding').onclick = () => load(true);
  } finally {
   clearTimeout(timer); loading = false; content.setAttribute('aria-busy','false');
   if (returnFocus && !scene && (document.activeElement===document.body || document.activeElement===retry)) {
    const target = document.getElementById('retryEnding') || content.querySelector('h1');
    if (target) { if (target.tagName === 'H1') target.tabIndex = -1; target.focus(); }
   }
  }
 }
 document.addEventListener('visibilitychange', () => {
  stop(); paint();
  if (playing && !document.hidden) frame = requestAnimationFrame(tick);
 });
 reduced.addEventListener('change', () => { if (reduced.matches && scene) finish(); });
 window.addEventListener('pagehide', stop);
 window.addEventListener('pageshow', () => { if (playing && !document.hidden && !frame) frame = requestAnimationFrame(tick); });
 document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && playing) { event.preventDefault(); finish(true); }
 });
 load();
})();
