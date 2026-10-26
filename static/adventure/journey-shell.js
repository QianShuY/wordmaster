'use strict';
(()=>{
 const sidebar=document.querySelector('.atlas-sidebar'),panels=[...document.querySelectorAll('.atlas-panel-details')],buttons=[...document.querySelectorAll('[data-atlas-panel]')];
 function paint(){const selected=panels.find(p=>p.open)?.dataset.panel||'map';sidebar.dataset.activePanel=selected;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasPanel===selected)));}
 function show(name){panels.forEach(p=>{p.open=p.dataset.panel===name;});paint();}
 buttons.forEach(b=>b.addEventListener('click',()=>{show(b.dataset.atlasPanel);if(innerWidth<=760)(b.dataset.atlasPanel==='map'?document.querySelector('.world-map'):sidebar).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});}));
 panels.forEach(p=>p.addEventListener('toggle',paint));
 document.getElementById('openLatestClue').addEventListener('click',()=>show('clues'));
 function actionLabel(button,text){const label=button.querySelector('.action-label');if(label)label.textContent=text;else button.textContent=text;button.setAttribute('aria-label',text);}
 window.MociAtlasUI={show,actionLabel};paint();
})();
