'use strict';
(async()=>{
 try{
  const response=await fetch('/api/adventure/campaign',{cache:'no-store'});
  if(!response.ok)return;
  const state=await response.json();
  if(!state.bossAvailable)return;
  document.querySelectorAll('[data-final-gate]').forEach(link=>{link.hidden=false;});
  document.getElementById('campGateHint').textContent='线索已齐，雾桥之约已至。';
 }catch{}
})();
