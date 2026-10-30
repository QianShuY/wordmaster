'use strict';
const MobileSound=(()=>{
 const music=new Audio();music.loop=true;music.preload='none';music.volume=.16;music.id='mobileMusic';music.hidden=true;music.setAttribute('aria-hidden','true');document.body.append(music);
 let enabled=false,current='',generation=0,effects=[],chosen=false;
 const tracks={journey:'first-light-on-the-road.wav',early:'letters-at-the-mist-bridge.wav',middle:'mist-bridge-tension.wav',final:'mist-bridge-last-stand.wav',ending:'beyond-the-mist-v1.wav'};
 async function play(name){if(!enabled||document.hidden)return;const file=tracks[name];if(!file)return;const id=++generation;if(current!==file){music.pause();music.src='media/'+file;current=file;}try{await music.play();if(id!==generation&&!enabled)music.pause();}catch{if(id!==generation)return;enabled=false;music.pause();toast('配乐未能播放，请轻触配乐按钮重试');}paint();}
 function paint(){document.querySelectorAll('[data-action="music"]').forEach(b=>{const label=b.querySelector?.('[data-music-label]');if(label)label.textContent=enabled?'配乐开':'配乐关';else b.textContent=b.dataset?.compact?'♫':enabled?'♫ 配乐开':'♫ 配乐关';b.setAttribute('aria-label',enabled?'关闭配乐':'播放配乐');b.setAttribute('aria-pressed',String(enabled));});}
 function pause(){++generation;music.pause();effects.forEach(a=>a.pause());effects=[];}
 function scope(){if(document.hidden||!['journey','battle'].includes(tab)){pause();return;}const phase=tab==='journey'?'journey':battleView?.snapshot.phase==='won'?'ending':battleView?.snapshot.bossHp<=60?'final':battleView?.snapshot.bossHp<=120?'middle':'early';void play(phase);}
 function effect(name){if(document.hidden)return;const file={hit:'ink',charge:'ink',break:'break',defend:'defend',hurt:'wound',storm:'storm',sweep:'sweep',slam:'slam'}[name]||'ink';effects=effects.filter(a=>!a.ended&&!a.paused);if(effects.length>2)effects.shift().pause();const a=new Audio('media/impact-'+file+'-v1.wav');a.volume=name==='charge'?.12:.35;effects.push(a);a.play().catch(()=>{});}
 return {scope,paint,pause,effect,toggle(){chosen=true;enabled=!enabled;if(enabled)scope();else pause();paint();},enable(){if(!chosen)enabled=true;scope();},stop:pause};
})();
document.addEventListener('visibilitychange',()=>{if(document.hidden)MobileSound.pause();else MobileSound.scope();});window.addEventListener('pagehide',MobileSound.pause);
