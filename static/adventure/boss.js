'use strict';
(() => {
  const model=window.MociBossMotion.create();
  const scene=document.getElementById('encounter');
  const pauseButton=document.getElementById('pauseMotion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  // Deterministic lanes keep the paper choreography stable on every replay.
  const paperField=document.querySelector('.paper-storm');
  for(let i=0;i<22;i++){
    const orbit=document.createElement('span'),page=document.createElement('i');
    orbit.className='paper-orbit';
    orbit.style.cssText=`--lane:${i%4};--lag:${(i%7)*.07}s;--x:${-160+(i*83)%350}px;--y:${-90+(i*47)%220}px;--fly:${-290+(i*61)%480}px;--fall:${110+(i*37)%190}px;--turn:${-190+(i*97)%470}deg;--size:${20+(i*11)%27}px;--tilt:${-40+(i*29)%85}deg`;
    page.className='torn-page';orbit.append(page);paperField.append(orbit);
  }
  let manuallyPaused=false,lastTime=performance.now(),frame=0;
  function render(announce=true){
    const state=window.MociBossMotion.states[model.state];
    // Replace the state once per transition; CSS restarts only the chosen effect.
    scene.dataset.state=model.state;
    document.dispatchEvent(new CustomEvent('moci-boss-state',{detail:model.state}));
    document.getElementById('intentText').textContent=state.intent;
    document.getElementById('intentDetail').textContent=state.detail;
    document.getElementById('stateLabel').textContent=state.label;
    document.getElementById('sceneSeal').textContent=state.seal;
    if(announce&&document.getElementById('motionStatus'))document.getElementById('motionStatus').textContent=state.status;
    const skillRoot={attack:'charge',sealSlam:'sealCharge',sealed:'sealCharge',storm:'stormCharge'};
    document.querySelectorAll('[data-motion]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.motion===(skillRoot[model.state]||model.state))));
  }
  function tick(now){
    const elapsed=Math.max(0,now-lastTime);lastTime=now;
    if(model.advance(elapsed))render();
    if(!model.paused&&model.remaining>0)frame=requestAnimationFrame(tick);else frame=0;
  }
  function schedule(){if(!frame&&!model.paused&&model.remaining>0){lastTime=performance.now();frame=requestAnimationFrame(tick);}}
  function syncPause(){
    const paused=manuallyPaused||document.hidden||!document.hasFocus();
    model.pause(paused);scene.classList.toggle('is-paused',paused);
    pauseButton.setAttribute('aria-pressed',String(manuallyPaused));
    pauseButton.textContent=manuallyPaused?'继续动态':'暂停动态';
    if(paused&&frame){cancelAnimationFrame(frame);frame=0;}else schedule();
  }
  function trigger(name){
    if(frame){cancelAnimationFrame(frame);frame=0;}
    // Repeated action buttons retrigger their animation without a timer race.
    scene.dataset.state='resetting';void scene.offsetWidth;
    model.trigger(name);render();syncPause();
  }
  document.querySelectorAll('[data-motion]').forEach(button=>button.addEventListener('click',()=>{
    scene.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
    trigger(button.dataset.motion);
  }));
  document.getElementById('resetScene')?.addEventListener('click',()=>trigger('idle'));
  document.addEventListener('moci-boss-motion',event=>{if(Object.hasOwn(window.MociBossMotion.states,event.detail))trigger(event.detail);});
  pauseButton.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;syncPause();});
  document.addEventListener('visibilitychange',syncPause);window.addEventListener('blur',syncPause);window.addEventListener('focus',syncPause);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){manuallyPaused=true;syncPause();}});
  function syncReduced(){scene.classList.toggle('reduced-motion',reduced.matches);pauseButton.textContent=manuallyPaused?'继续动态':'暂停动态';}
  reduced.addEventListener('change',syncReduced);
  const assets=[document.querySelector('.guardian'),...['mist-bridge-v1.png','warden-lantern-v1.png','warden-shield-v1.png','warden-storm-v1.png','shield-ink-impact-v1.png','torn-page.svg','lantern-brush.svg'].map(file=>{const image=new Image();image.src='assets/'+file;return image;})];
  assets.forEach(image=>{image.addEventListener('error',()=>{document.getElementById('assetError').hidden=false;});if(image.complete&&image.naturalWidth===0)document.getElementById('assetError').hidden=false;});
  render(false);syncReduced();syncPause();
})();
