'use strict';
(()=>{
 const map=document.querySelector('.world-map'),plane=document.querySelector('.world-plane'),workspace=document.querySelector('.atlas-workspace'),main=map?.closest('main');
 if(!map||!plane)return;
 let frame=0,last='';
 function fit(){
  frame=0;
  if(innerWidth<=760){map.style.removeProperty('--map-fit-width');for(const key of ['--atlas-content-width','--atlas-map-height'])main?.style.removeProperty(key);last='';return;}
  const [width,height=1]=getComputedStyle(plane).aspectRatio.split('/').map(Number);
  const ratio=width>0&&height>0?width/height:1.5;
  const style=getComputedStyle(main),row=document.querySelector('.atlas-topline'),footer=document.querySelector('.atlas-bottom'),preview=document.getElementById('previewControls');
  const previewHeight=preview&&!preview.hidden?preview.getBoundingClientRect().height:0;
  const availableHeight=Math.max(120,main.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-row.getBoundingClientRect().height-footer.getBoundingClientRect().height-previewHeight-parseFloat(style.rowGap)*(previewHeight?3:2));
  const sidebar=document.querySelector('.atlas-sidebar'),asideWidth=sidebar.getBoundingClientRect().width,gap=parseFloat(getComputedStyle(workspace).columnGap);
  const availableWidth=main.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-asideWidth-gap;
  const mapWidth=Math.max(120,Math.floor(Math.min(availableHeight*ratio,availableWidth))),mapHeight=mapWidth/ratio;
  const next=mapWidth+':'+asideWidth+':'+gap;
  if(next!==last){map.style.setProperty('--map-fit-width',mapWidth+'px');main.style.setProperty('--atlas-content-width',(mapWidth+asideWidth+gap)+'px');main.style.setProperty('--atlas-map-height',mapHeight+'px');last=next;}
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(fit);};
 const observer=new ResizeObserver(schedule);
 for(const element of document.querySelectorAll('main,.atlas-sidebar,.atlas-topline,.atlas-bottom,.folio-header,#previewControls'))observer.observe(element);
 document.addEventListener('moci-map-layout-change',schedule);
 window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
 window.addEventListener('pageshow',schedule);
 window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
 fit();
})();
