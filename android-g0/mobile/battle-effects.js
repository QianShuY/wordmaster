(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MociBattleEffects=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 // Presentation only: never change the battle, its timer, or its saved record.
 function plan(before,after,outcome,type){
  if(!before||!after)return [];
  if(after.phase==='stormIntro'&&before.phase!=='stormIntro')return [{at:0,kind:'domain'}];
  if(type==='revive'&&after.hp>before.hp)return [{at:0,kind:'restore',restored:after.hp-before.hp}];
  if(after.answered<=before.answered)return [];
  if(outcome?.pending)return [{at:0,kind:outcome.ok?'charge':'miss'}];
  const r=after.result;if(!r||r.damage===undefined)return [];
  const enemy={lantern:'sweep',seal:'slam',storm:'storm'}[r.enemy]||'sweep',events=[];
  if(r.ok&&r.spell==='defend'){
   events.push({at:0,kind:'guard'},{at:200,kind:enemy},{at:580,kind:'block'});
   if(r.damage)events.push({at:900,kind:'hit',damage:r.damage});
  }else if(r.ok){
   events.push(r.spell==='heal'?{at:0,kind:'restore',restored:r.restored}:{at:0,kind:'cast'});
   if(r.damage)events.push({at:190,kind:r.shieldBroken?'break':'hit',damage:r.damage});
   if(r.received)events.push({at:880,kind:enemy});
  }else events.push({at:0,kind:enemy});
  if(r.received)events.push({at:r.ok?1100:400,kind:'wound',received:r.received});
  if(after.phase==='won')events.push({at:1250,kind:'victory'});
  return events;
 }
 function markup(){return `<div class="combat-fx" aria-hidden="true"><i class="fx-ring"></i><i class="fx-strike"></i><i class="fx-flare"></i><div class="fx-shards">${Array.from({length:10},(_,i)=>`<i style="--n:${i}"></i>`).join('')}</div><div class="fx-sweep"><img src="media/lantern-brush.svg" alt=""></div><div class="fx-ground"><img src="media/shield-ink-impact-v1.webp" alt=""></div><i class="fx-ward"></i><i class="fx-restore"></i><i class="fx-wound"></i><div class="fx-number fx-enemy"><b></b><small>命中守卫</small></div><div class="fx-number fx-traveler"><b></b><small></small></div><span class="fx-verdict"></span></div>`;}
 function create({document:doc,sound=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}){
  let timers=[],generation=0;
  const node=s=>doc.querySelector(s);
  function cancel(){generation++;timers.forEach(clearTimer);timers=[];}
  function pulse(selector,animation='is-playing'){
   const el=node(selector);if(!el)return;el.classList.remove(animation);void el.offsetWidth;el.classList.add(animation);
  }
  function number(selector,value,label){const el=node(selector);if(!el)return;el.dataset.kind=value.startsWith('−')?'loss':'gain';el.querySelector('b').textContent=value;el.querySelector('small').textContent=label;pulse(selector);}
  function verdict(text){const el=node('.fx-verdict');if(!el)return;el.textContent=text;pulse('.fx-verdict');}
  function event(e){
   if(doc.hidden||!node('.mobile-battle'))return;
   switch(e.kind){
    case 'charge':pulse('.fx-ring');verdict('咒文凝聚');sound('charge');break;
    case 'miss':pulse('.fx-wound');verdict('封印未破 · −6 秒');break;
    case 'cast':pulse('.fx-ring');pulse('.fx-strike');break;
    case 'hit':case 'break':
     pulse('.fx-strike');pulse('.fx-flare');pulse('.warden-body','fx-stagger');
     if(e.kind==='break'){pulse('.fx-shards');verdict('石印碎裂');}
     number('.fx-enemy','−'+e.damage,e.kind==='break'?'破盾 · 命中守卫':'命中守卫');sound(e.kind);break;
    case 'guard':pulse('.fx-ward');verdict('护页展开');break;
    case 'block':pulse('.fx-flare');verdict('格挡 · 反击');sound('defend');break;
    case 'restore':pulse('.fx-restore');number('.fx-traveler','+'+e.restored,'生命恢复');sound('defend');break;
    case 'sweep':pulse('.warden-body','fx-lunge');pulse('.fx-sweep');sound('sweep');break;
    case 'slam':pulse('.warden-body','fx-slam');pulse('.fx-ground');pulse('.battle-backdrop','fx-recoil');sound('slam');break;
    case 'storm':pulse('.fx-shards');pulse('.battle-backdrop','fx-recoil');sound('storm');break;
    case 'wound':pulse('.fx-wound');pulse('.battle-backdrop','fx-recoil');number('.fx-traveler','−'+e.received,'旅人承伤');sound('hurt');break;
    case 'domain':sound('storm');break;
    case 'victory':verdict('雾桥已开');pulse('.fx-restore');break;
   }
  }
  function play(before,after,outcome,type){cancel();const id=generation;for(const e of plan(before,after,outcome,type)){if(!e.at)event(e);else timers.push(setTimer(()=>{if(id===generation)event(e);},e.at));}}
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancel();});
  return {play,cancel};
 }
 return {plan,markup,create};
});
