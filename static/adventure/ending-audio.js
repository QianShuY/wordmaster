'use strict';
(() => {
 const key='moci-ending-audio-v1';
 window.MociEndingAudio={attach(button,slider,replay){
  let prefs={enabled:true,volume:22};
  try { const prior=JSON.parse(localStorage.getItem('moci-battle-audio-v1'));if(typeof prior?.music==='boolean')prefs.enabled=prior.music;if(Number.isFinite(prior?.musicVolume))prefs.volume=Math.max(0,Math.min(100,prior.musicVolume));const own=JSON.parse(localStorage.getItem(key));if(typeof own?.enabled==='boolean')prefs.enabled=own.enabled;if(Number.isFinite(own?.volume))prefs.volume=Math.max(0,Math.min(100,own.volume)); } catch {}
  const audio=new Audio('assets/beyond-the-mist-v1.wav');audio.preload='none';audio.loop=false;audio.volume=0;
  let generation=0,frame=0,waiting=false,ended=false,view='scene',started=false,away=false;
  const status=document.getElementById('endingAudioStatus');
  const blocked=()=>document.hidden||away;
  const level=()=>Math.min(.55,prefs.volume/100*(view==='letter'?.25:.72));
  function paint(){button.textContent=waiting?'♫ 开启配乐':ended?'♫ 重听终章':prefs.enabled?'♫ 配乐 · 开':'♫ 配乐 · 关';button.setAttribute('aria-pressed',String(prefs.enabled&&!waiting&&!ended));slider.value=prefs.volume;slider.setAttribute('aria-valuetext',prefs.volume+'%');}
  function save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}paint();}
  function halt(){++generation;cancelAnimationFrame(frame);frame=0;audio.pause();audio.volume=0;}
  function fade(){cancelAnimationFrame(frame);const from=audio.volume,to=level(),start=performance.now();function step(now){frame=0;if(blocked()||!prefs.enabled)return;const t=Math.max(0,Math.min(1,(now-start)/1100));audio.volume=from+(to-from)*t;if(t<1)frame=requestAnimationFrame(step);}frame=requestAnimationFrame(step);}
  async function play(){
   const ticket=++generation;
   if(!prefs.enabled||blocked()||ended){halt();paint();return;}
   try { await audio.play();if(ticket!==generation){if(blocked()||!prefs.enabled)audio.pause();return;}waiting=false;status.textContent='';paint();fade(); }
   catch { if(ticket===generation){waiting=true;status.textContent='点击配乐按钮，随音乐重看终幕。';paint();} }
  }
  const controller={
   restart(){halt();started=true;ended=false;view='scene';try{audio.currentTime=0;}catch{}play();},
   arrival(skipped=false){if(skipped&&started&&!ended&&audio.currentTime<9)try{audio.currentTime=9;}catch{}},
   read(){view='letter';if(!audio.paused)fade();},
   scene(){view='scene';if(!audio.paused)fade();}
  };
  button.addEventListener('click',()=>{
   if(waiting||ended||!prefs.enabled){prefs.enabled=true;waiting=false;save();replay();}
   else{prefs.enabled=false;halt();save();status.textContent='';}
  });
  slider.addEventListener('input',()=>{prefs.volume=Math.max(0,Math.min(100,Number(slider.value)||0));save();if(!audio.paused)fade();});
  audio.addEventListener('ended',()=>{ended=true;cancelAnimationFrame(frame);frame=0;paint();});
  document.addEventListener('visibilitychange',()=>{if(blocked())halt();else if(started)play();});
  window.addEventListener('blur',()=>{away=true;halt();});
  window.addEventListener('focus',()=>{away=false;if(started)play();});
  window.addEventListener('pagehide',halt);
  window.addEventListener('pageshow',()=>{if(started&&!blocked())play();});
  paint();return controller;
 }};
})();
