'use strict';
(()=>{
 const key='moci-shell-theme-v1';
 function apply(theme){
  const root=document.documentElement;
  if(!theme||!theme.values||!/^[a-z0-9_-]+$/i.test(theme.palette||''))return;
  for(const name of ['accent','deep','paper','ground','wash','line','ink','muted']){
   const value=theme.values[name];
   if(typeof value==='string'&&/^#[0-9a-f]{3,8}$/i.test(value))root.style.setProperty('--theme-'+name,value);
  }
  root.style.setProperty('--theme-art',`url("/cards/original/${theme.palette}.webp")`);
  if(/^\d{1,3}%\s+\d{1,3}%$/.test(theme.position||''))root.style.setProperty('--theme-header-position',theme.position);
  root.classList.add('has-card-theme');
 }
 let pending=Promise.resolve();
 function save(theme){pending=pending.catch(()=>{}).then(()=>fetch('/api/desktop/theme',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({theme})})).catch(()=>{});try{if(theme)localStorage.setItem(key,JSON.stringify(theme));else localStorage.removeItem(key);}catch{}}
 function restore(){try{apply(JSON.parse(localStorage.getItem(key)||'null'));}catch{}}
 window.MociThemeBridge={save,restore};
 if(location.pathname.startsWith('/adventure/'))restore();
})();
