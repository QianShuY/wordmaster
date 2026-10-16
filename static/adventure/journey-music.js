'use strict';
(()=>{
 const button=document.getElementById('journeyMusic');
 const volume=document.getElementById('musicVolume');
 const output=document.getElementById('musicVolumeValue');
 const track=new Audio('assets/first-light-on-the-road.wav');
 track.loop=true;track.preload='none';track.volume=0;
 let enabled=false,frame=0,request=0;
 const target=()=>Number(volume.value)/100*.65;
 function fade(to){
  cancelAnimationFrame(frame);
  const start=performance.now(),from=track.volume;
  function step(now){
   const progress=Math.min(1,(now-start)/900);
   track.volume=from+(to-from)*progress;
   if(progress<1)frame=requestAnimationFrame(step);
   else if(!enabled)track.pause();
  }
  frame=requestAnimationFrame(step);
 }
 function paint(){button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'♫ 旅途配乐 · 暂停':'♫ 旅途配乐 · 播放';}
 button.addEventListener('click',async()=>{
  const id=++request;
  if(enabled){enabled=false;paint();fade(0);return;}
  button.disabled=true;
  try{
   await track.play();
   if(id!==request)return;
   enabled=true;paint();fade(target());
  }catch{enabled=false;paint();button.textContent='配乐未能播放 · 点击重试';}
  finally{button.disabled=false;}
 });
 volume.addEventListener('input',()=>{output.textContent=volume.value+'%';if(enabled)fade(target());});
 document.addEventListener('visibilitychange',async()=>{
  if(document.hidden){cancelAnimationFrame(frame);track.pause();track.volume=0;}
  else if(enabled){try{await track.play();fade(target());}catch{enabled=false;paint();}}
 });
 window.addEventListener('pagehide',()=>{++request;cancelAnimationFrame(frame);track.pause();});
})();
