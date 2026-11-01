'use strict';
// Synchronous DOM updates keep form focus, draft saving and battle clocks intact.
// Only the visual outgoing surface is retained briefly, with no live controls.
(function(root){
 function create(doc,route){
  const win=doc.defaultView,app=doc.getElementById('app');
  let previous='',animations=[],ghost=null,dialogAnimation=null,dialogEpoch=0;
  const reduced=()=>win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function cancel(){for(const a of animations)a.cancel();animations=[];ghost?.remove();ghost=null;}
  function animate(node,frames,options){if(!node?.animate||reduced()||doc.hidden)return null;const a=node.animate(frames,options);void a.finished.catch(()=>{});return a;}
  function paint(html){
   cancel();const key=route(),changed=previous!==key;
   const selector=!changed&&key==='study'?'.study-sheet':!changed&&key==='battle'?'.battle-panel':null;
   const old=selector?app.querySelector(selector):app.firstElementChild;
   if(old&&!reduced()&&!doc.hidden&&old.animate){
    const r=old.getBoundingClientRect();
    if(r.width&&r.height){
     ghost=old.cloneNode(true);ghost.inert=true;ghost.setAttribute('aria-hidden','true');
     for(const node of [ghost,...ghost.querySelectorAll('[id]')])node.removeAttribute('id');
     for(const control of ghost.querySelectorAll('button,input,select,textarea')){control.disabled=true;control.tabIndex=-1;}
     ghost.classList.add('motion-ghost');Object.assign(ghost.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',margin:'0',transform:'none',minHeight:'0',maxHeight:'none',overflow:'hidden',pointerEvents:'none',zIndex:'7'});
     doc.body.append(ghost);
    }
   }
   app.innerHTML=html;previous=key;
   const next=selector?app.querySelector(selector):app.firstElementChild;
   const options={duration:changed?240:180,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'};
   // Battle panels already use transform for centering; use opacity alone there.
   const frames=key==='battle'&&!changed?[{opacity:0},{opacity:1}]:[{opacity:0,translate:changed?'0 8px':'8px 0'},{opacity:1,translate:'0 0'}];
   const incoming=animate(next,frames,options);if(incoming)animations.push(incoming);
   const outgoing=animate(ghost,[{opacity:1},{opacity:0}],{duration:150,easing:'ease-out',fill:'both'});
   if(outgoing){animations.push(outgoing);const oldGhost=ghost;void outgoing.finished.then(()=>oldGhost.remove()).catch(()=>{});}else{ghost?.remove();ghost=null;}
  }
  function openDialog(sheet,html){dialogEpoch++;dialogAnimation?.cancel();sheet.innerHTML=html;if(!sheet.open)sheet.showModal();dialogAnimation=animate(sheet,[{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:220,easing:'cubic-bezier(.2,.7,.3,1)'});}
  async function closeDialog(sheet){if(!sheet.open)return;const epoch=++dialogEpoch;dialogAnimation?.cancel();dialogAnimation=animate(sheet,[{opacity:1,translate:'0 0'},{opacity:0,translate:'0 10px'}],{duration:140,easing:'ease-in',fill:'both'});if(dialogAnimation)await dialogAnimation.finished.catch(()=>{});if(epoch===dialogEpoch){sheet.close();dialogAnimation?.cancel();dialogAnimation=null;}}
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancel();});
  return {paint,openDialog,closeDialog};
 }
 root.MociMotion={create};
})(window);
