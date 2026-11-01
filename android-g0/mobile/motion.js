'use strict';
// Keep one live screen. No cloned pages, layout reads, movement or delayed close.
(function(root){
 function create(doc,route){
  const win=doc.defaultView,app=doc.getElementById('app');
  let previous='',animations=[],dialogAnimation=null;
  const reduced=()=>win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function cancel(){for(const a of animations)a.cancel();animations=[];}
  function animate(node,frames,options){if(!node?.animate||reduced()||doc.hidden)return null;const a=node.animate(frames,options);void a.finished.catch(()=>{});return a;}
  function paint(html){
   cancel();const key=route(),changed=previous!==key;
   app.innerHTML=html;previous=key;
   // Repeated question / filter / battle updates are immediately readable.
   // Only a route change gets a brief, nearly opaque settling fade.
   if(changed&&!['today','words','journey','cards','mine'].includes(key)){const a=animate(app.firstElementChild,[{opacity:.92},{opacity:1}],{duration:110,easing:'ease-out'});if(a)animations.push(a);}
  }
  function openDialog(sheet,html){dialogAnimation?.cancel();sheet.innerHTML=html;if(!sheet.open)sheet.showModal();dialogAnimation=animate(sheet,[{opacity:.94},{opacity:1}],{duration:100,easing:'ease-out'});}
  function closeDialog(sheet){dialogAnimation?.cancel();dialogAnimation=null;if(sheet.open)sheet.close();}
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden){cancel();dialogAnimation?.cancel();dialogAnimation=null;}});
  return {paint,openDialog,closeDialog};
 }
 root.MociMotion={create};
})(window);
