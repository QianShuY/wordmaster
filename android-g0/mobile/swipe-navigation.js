'use strict';
(function(root){
 const tabs=['today','words','journey','cards','mine'];
 function destination(route,dx){const index=tabs.indexOf(route);return index<0?null:tabs[index+(dx<0?1:-1)]||null;}
 function commits(dx,dy,ms,width){return Math.abs(dx)>Math.abs(dy)*1.3&&(Math.abs(dx)>=Math.max(56,width*.18)||Math.abs(dx)>30&&Math.abs(dx)/Math.max(ms,1)>.5);}
 function install(doc,{route,blocked,navigate}){
  const win=doc.defaultView,app=doc.getElementById('app');let drag=null,animation=null,pending=false,shown='',lastX=0,raf=0,suppressUntil=0;
  const reduced=()=>win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function clean(){if(raf)win.cancelAnimationFrame(raf);raf=0;animation?.cancel();animation=null;app.style.transform='';doc.body.classList.remove('swipe-dragging');doc.querySelector('[data-swipe-target]')?.removeAttribute('data-swipe-target');}
  function tween(frames,ms){if(reduced()||!app.animate){app.style.transform='';return;}animation=app.animate(frames,{duration:ms,easing:'cubic-bezier(.2,.75,.25,1)'});void animation.finished.catch(()=>{});}
  function abort(){drag=null;pending=false;const x=lastX;clean();lastX=0;if(x)tween([{transform:`translate3d(${x}px,0,0)`},{transform:'translate3d(0,0,0)'}],180);}
  function go(target){if(blocked()||pending||!tabs.includes(target)||target===route())return;pending=true;navigate(target);}
  doc.addEventListener('pointerdown',e=>{
   if(e.isPrimary===false){if(drag)abort();return;}
   if(e.button>0||pending||blocked()||!tabs.includes(route())||doc.querySelector('dialog[open]')||e.target.closest('input,textarea,select,[contenteditable],#wordKeyboard,#atlasViewport'))return;
   clean();lastX=0;drag={id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp,locked:false};
  },{passive:true});
  doc.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   if(!drag.locked){if(Math.abs(dy)>10&&Math.abs(dy)>=Math.abs(dx)){drag=null;return;}if(Math.abs(dx)<12||Math.abs(dx)<=Math.abs(dy)*1.3)return;drag.locked=true;doc.body.classList.add('swipe-dragging');}
   if(e.cancelable)e.preventDefault();const next=destination(route(),dx),width=win.innerWidth;
   lastX=Math.max(-width*.85,Math.min(width*.85,dx))*(next?1:.18);
   doc.querySelector('[data-swipe-target]')?.removeAttribute('data-swipe-target');if(next)doc.querySelector(`#nav [data-tab="${next}"]`)?.setAttribute('data-swipe-target','true');
   if(!raf)raf=win.requestAnimationFrame(()=>{raf=0;app.style.transform=`translate3d(${lastX}px,0,0)`;});
  },{passive:false});
  function end(e,cancelled){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(!d.locked)return;suppressUntil=Date.now()+350;const dx=e.clientX-d.x,dy=e.clientY-d.y,target=destination(route(),dx);
   if(!cancelled&&target&&commits(dx,dy,e.timeStamp-d.time,win.innerWidth)&&!blocked()){go(target);return;}abort();}
  doc.addEventListener('pointerup',e=>end(e,false));doc.addEventListener('pointercancel',e=>end(e,true));
  doc.addEventListener('click',e=>{if(Date.now()<suppressUntil){suppressUntil=0;e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
  function painted(key){const old=shown;shown=key;pending=false;drag=null;clean();lastX=0;
   if(old!==key&&tabs.includes(old)&&tabs.includes(key)){
    const direction=tabs.indexOf(key)>tabs.indexOf(old)?1:-1;
    tween([{transform:`translate3d(${direction*Math.min(64,win.innerWidth*.16)}px,0,0)`},{transform:'translate3d(0,0,0)'}],210);
   }
  }
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden){drag=null;pending=false;clean();lastX=0;}});
  win.addEventListener('resize',()=>{drag=null;clean();lastX=0;});
  return {painted,go,abort};
 }
 const api={install,destination,commits};if(typeof module==='object'&&module.exports)module.exports=api;else root.MociSwipe=api;
})(typeof window==='object'?window:globalThis);
