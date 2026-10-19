'use strict';
(()=>{
 const descriptions={120:'灯已举起。守卫逼近，低弦沉沉压住石桥。',60:'风里透出一线光。熟悉的主题渐渐抬起，旅人稳住脚步。',30:'现在，轮到你向前。铜管展开主题，带着记忆冲破最后的雾。'};
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
