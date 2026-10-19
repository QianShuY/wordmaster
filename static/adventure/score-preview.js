'use strict';
(()=>{
 const descriptions={120:'灯已举起。低沉的弓弦，牵着同一条旋律缓缓前行。',60:'石印松动，残页苏醒。同一条旋律中，脉冲渐渐靠近。',30:'只余最后一道关隘。弦乐紧随主题，推动最后的咒语。'};
 let health=120,started=false;
 document.querySelectorAll('[data-hp]').forEach(button=>button.addEventListener('click',()=>{
  health=Number(button.dataset.hp);started=true;
  document.querySelectorAll('[data-hp]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  document.getElementById('previewHp').textContent=health+' / 120';document.getElementById('previewBar').value=health;
  document.getElementById('scoreDescription').textContent=descriptions[health];window.MociBattleAudio?.setState('choose',health,false);
 }));
 function sync(){if(started)window.MociBattleAudio?.setState('choose',health,document.hidden||!document.hasFocus());}
 window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);
})();
