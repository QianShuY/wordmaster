'use strict';
// Keep editing dialogs operable by keyboard without changing their save paths.
(() => {
 if(window.Capacitor?.getPlatform?.()==='android')return;
 const configs=[['wordModal','wordModalCancel'],['importModal','importCancel'],['cardModal',null]];
 const controls=mask=>[...mask.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')]
  .filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length>0);
 for(const [id,cancel] of configs){
  const mask=document.getElementById(id);if(!mask)continue;
  let open=false,opener=null;
  const sync=()=>{
   const visible=!mask.classList.contains('hidden');
   if(visible&&!open){opener=document.activeElement;open=true;queueMicrotask(()=>{
    if(!mask.contains(document.activeElement))controls(mask)[0]?.focus();
   });}
   else if(!visible&&open){open=false;const previous=opener;opener=null;if(previous?.isConnected&&!mask.contains(previous))previous.focus({preventScroll:true});}
  };
  // Capture the opener before an existing click handler focuses the form.
  document.addEventListener('click',()=>{if(!open)opener=document.activeElement;},true);
  new MutationObserver(()=>{
   const wasOpen=open,previous=opener;sync();
   if(!wasOpen&&open&&previous&&!mask.contains(previous))opener=previous;
  }).observe(mask,{attributes:true,attributeFilter:['class']});
  document.addEventListener('keydown',event=>{
   if(!open||event.defaultPrevented)return;
   if(event.key==='Escape'){if(cancel){event.preventDefault();document.getElementById(cancel)?.click();}return;}
   if(event.key!=='Tab')return;
   const items=controls(mask);if(!items.length)return;
   const first=items[0],last=items.at(-1),active=document.activeElement;
   if(!items.includes(active)||event.shiftKey&&active===first||!event.shiftKey&&active===last){event.preventDefault();(event.shiftKey?last:first).focus();}
  });
 }
})();
