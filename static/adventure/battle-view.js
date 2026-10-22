'use strict';
// View-only controls. Combat, saved events and formal rewards remain owned by
// battle.js and the server; entering fullscreen never starts a battle.
(()=>{
 const button=document.getElementById('battleFullscreen'),status=document.getElementById('fullscreenStatus');
 if(!button)return;
 function paint(){
  const active=Boolean(document.fullscreenElement);
  button.textContent=active?'退出全屏':'进入全屏';button.setAttribute('aria-pressed',String(active));
 }
 button.addEventListener('click',async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
   else throw Error('unsupported');
   status.textContent='';
  }catch{status.textContent='当前窗口不支持系统全屏，战场仍会铺满可用画面。';}
  paint();
 });
 document.addEventListener('fullscreenchange',paint);paint();
})();
