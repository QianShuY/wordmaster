'use strict';
(()=>{
 const map=document.querySelector('.world-map'),plane=document.querySelector('.world-plane');
 if(!map||!plane)return;
 let frame=0,last='';
 function fit(){
  frame=0;
  if(innerWidth<=760){map.style.removeProperty('--map-fit-width');last='';return;}
  const [width,height=1]=getComputedStyle(plane).aspectRatio.split('/').map(Number);
  const ratio=width>0&&height>0?width/height:1.5;
  const documentTop=map.getBoundingClientRect().top+window.scrollY;
  const available=Math.max(160,(window.visualViewport?.height||innerHeight)-documentTop-28);
  const next=Math.floor(available*ratio)+'px';
  if(next!==last){map.style.setProperty('--map-fit-width',next);last=next;}
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(fit);};
 const observer=new ResizeObserver(schedule);
 for(const element of document.querySelectorAll('.folio-header,.campaign-heading,.travel-toolbar,.journey-score,#previewControls'))observer.observe(element);
 window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
 window.addEventListener('pageshow',schedule);
 window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
 fit();
})();
