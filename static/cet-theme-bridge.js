'use strict';
(() => {
 const key='moci-shell-theme-v1';
 let receiver=null,last=null;
 const allowed=origin=>/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin);
 function publish(theme){
  if(!receiver||parent===window)return;
  const serialized=JSON.stringify(theme);
  if(serialized===last)return;
  last=serialized;parent.postMessage({type:'moci:theme',theme},receiver);
 }
 async function send(){
  if(!receiver)return;
  try {
   const response=await fetch('/api/desktop/theme',{cache:'no-store'});
   if(response.ok){const state=await response.json();if(state.available){publish(state.theme);return;}}
  }catch{}
  try {const saved=localStorage.getItem(key);if(saved!==null)publish(JSON.parse(saved));}catch{}
 }
 window.addEventListener('message',event=>{
  if(event.source!==parent||!allowed(event.origin)||event.data?.type!=='moci:theme-request')return;
  receiver=event.origin;last=null;void send();
 });
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null)void send();});
 // Also follow themes published from another browser or the desktop launcher.
 setInterval(send,1500);
})();
