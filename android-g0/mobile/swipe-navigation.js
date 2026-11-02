'use strict';
(function(root){
 const tabs=['today','words','journey','cards','mine'];
 function destination(route,dx){const index=tabs.indexOf(route);return index<0?null:tabs[index+(dx<0?1:-1)]||null;}
 function commits(dx,dy,ms,width){return Math.abs(dx)>Math.abs(dy)*1.15&&(Math.abs(dx)>=Math.max(48,width*.14)||Math.abs(dx)>26&&Math.abs(dx)/Math.max(ms,1)>.45);}
 function install(doc,{route,blocked,navigate}){
  const win=doc.defaultView,app=doc.getElementById('app');let drag=null,animation=null,pending=false,shown='',lastX=0,raf=0,suppressUntil=0;
  const reduced=()=>win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function clean(){if(raf)win.cancelAnimationFrame(raf);raf=0;animation?.cancel();animation=null;app.style.transform='';doc.body.classList.remove('swipe-dragging');doc.querySelector('[data-swipe-target]')?.removeAttribute('data-swipe-target');}
  function tween(frames,ms){if(reduced()||!app.animate){app.style.transform='';return;}animation=app.animate(frames,{duration:ms,easing:'cubic-bezier(.2,.75,.25,1)'});void animation.finished.catch(()=>{});}
  function abort(){drag=null;pending=false;const x=lastX;clean();lastX=0;if(x)tween([{transform:`translate3d(${x}px,0,0)`},{transform:'translate3d(0,0,0)'}],180);}
  function go(target){if(blocked()||pending||!tabs.includes(target)||target===route())return;pending=true;navigate(target);}
  function start(e){
   if(e.isPrimary===false){if(drag)abort();return;}
   if(e.button>0||pending||blocked()||!tabs.includes(route())||doc.querySelector('dialog[open]')||e.target.closest?.('input,textarea,select,[contenteditable],#wordKeyboard,#atlasViewport,.filters'))return;
   clean();lastX=0;drag={id:e.pointerId,x:e.clientX,y:e.clientY,time:e.timeStamp,locked:false};
  }
  function move(e){
   if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   if(!drag.locked){if(Math.abs(dy)>16&&Math.abs(dy)>Math.abs(dx)*1.2){drag=null;return;}if(Math.abs(dx)<10||Math.abs(dx)<=Math.abs(dy)*1.15)return;drag.locked=true;doc.body.classList.add('swipe-dragging');}
   if(e.cancelable)e.preventDefault();const next=destination(route(),dx),width=win.innerWidth;
   lastX=Math.max(-width*.85,Math.min(width*.85,dx))*(next?1:.18);
   doc.querySelector('[data-swipe-target]')?.removeAttribute('data-swipe-target');if(next)doc.querySelector(`#nav [data-tab="${next}"]`)?.setAttribute('data-swipe-target','true');
   if(!raf)raf=win.requestAnimationFrame(()=>{raf=0;app.style.transform=`translate3d(${lastX}px,0,0)`;});
  }
  function end(e,cancelled){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(!d.locked)return;suppressUntil=Date.now()+350;const dx=e.clientX-d.x,dy=e.clientY-d.y,target=destination(route(),dx);
   if(!cancelled&&target&&commits(dx,dy,e.timeStamp-d.time,win.innerWidth)&&!blocked()){go(target);return;}abort();}
  // Android can cancel Pointer Events as its scroll recognizer takes over.
  // A non-passive touchmove owns only horizontal gestures; vertical scrolling
  // remains native. Ignore touch Pointer Events to prevent duplicate commits.
  doc.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')start(e);},{passive:true});
  doc.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')move(e);},{passive:false});
  doc.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')end(e,false);});
  doc.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')end(e,true);});
  const touchEvent=(e,t)=>({pointerId:t.identifier,clientX:t.clientX,clientY:t.clientY,timeStamp:e.timeStamp,target:e.target,cancelable:e.cancelable,preventDefault:()=>e.preventDefault()});
  doc.addEventListener('touchstart',e=>{if(e.touches.length!==1){abort();return;}start(touchEvent(e,e.touches[0]));},{passive:true,capture:true});
  doc.addEventListener('touchmove',e=>{if(e.touches.length!==1){abort();return;}move(touchEvent(e,e.touches[0]));},{passive:false,capture:true});
  doc.addEventListener('touchend',e=>{const t=Array.from(e.changedTouches).find(t=>t.identifier===drag?.id);if(t)end(touchEvent(e,t),false);},{passive:true,capture:true});
  doc.addEventListener('touchcancel',()=>abort(),{passive:true,capture:true});
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
