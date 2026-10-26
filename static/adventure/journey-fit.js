'use strict';
(()=>{
 const map=document.querySelector('.world-map'),plane=document.querySelector('.world-plane'),workspace=document.querySelector('.atlas-workspace'),main=map?.closest('main');
 if(!map||!plane)return;
 let frame=0,last='';
 function fit(){
  frame=0;
  if(innerWidth<=760){map.style.removeProperty('--map-fit-width');for(const key of ['--atlas-content-width','--atlas-map-height','--atlas-workspace-height']){main?.style.removeProperty(key);document.body.style.removeProperty(key);}last='';return;}
  const [width,height=1]=getComputedStyle(plane).aspectRatio.split('/').map(Number);
  const ratio=width>0&&height>0?width/height:1.5;
  const style=getComputedStyle(main),row=document.querySelector('.atlas-topline'),footer=document.querySelector('.atlas-bottom'),preview=document.getElementById('previewControls');
  const previewHeight=preview&&!preview.hidden?preview.getBoundingClientRect().height:0;
  const study=document.querySelector('.atlas-study-tile'),encounter=document.getElementById('stageEncounter'),workspaceGap=parseFloat(getComputedStyle(workspace).rowGap);
  const encounterHeight=getComputedStyle(encounter).position==='absolute'?0:encounter.getBoundingClientRect().height;
  const bottomHeight=Math.max(study.getBoundingClientRect().height,encounterHeight);
  const availableHeight=Math.max(120,main.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-row.getBoundingClientRect().height-footer.getBoundingClientRect().height-previewHeight-parseFloat(style.rowGap)*(previewHeight?3:2)-bottomHeight-workspaceGap);
  const sidebar=document.querySelector('.atlas-sidebar'),asideWidth=sidebar.getBoundingClientRect().width,railWidth=document.querySelector('.atlas-quick-actions').getBoundingClientRect().width,gap=parseFloat(getComputedStyle(workspace).columnGap);
  const availableWidth=main.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-asideWidth-railWidth-gap*2;
  const mapWidth=Math.max(120,Math.floor(Math.min(availableHeight*ratio,availableWidth))),mapHeight=mapWidth/ratio;
  const next=mapWidth+':'+asideWidth+':'+railWidth+':'+gap+':'+bottomHeight;
  if(next!==last){map.style.setProperty('--map-fit-width',mapWidth+'px');const contentWidth=mapWidth+asideWidth+railWidth+gap*2;for(const element of [main,document.body]){element.style.setProperty('--atlas-content-width',contentWidth+'px');element.style.setProperty('--atlas-map-height',mapHeight+'px');element.style.setProperty('--atlas-workspace-height',(mapHeight+workspaceGap+bottomHeight)+'px');}last=next;}
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(fit);};
 const observer=new ResizeObserver(schedule);
 for(const element of document.querySelectorAll('main,.atlas-sidebar,.atlas-study-tile,.stage-encounter,.atlas-topline,.atlas-bottom,.folio-header,#previewControls'))observer.observe(element);
 document.addEventListener('moci-map-layout-change',schedule);
 window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
 window.addEventListener('pageshow',schedule);
 window.addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
 fit();
})();
