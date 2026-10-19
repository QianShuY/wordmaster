'use strict';
(()=>{
 const descriptions={120:'灯已举起。清音吉他划过低弦，贝斯藏在桥下的阴影里。',60:'脚步不再后退。失真吉他响起，鼓点托起熟悉的主题。',30:'现在，轮到你向前。主奏吉他与鼓组齐进，带着记忆冲破最后的雾。'};
 let health=120,started=false;
 document.querySelectorAll('[data-hp]').forEach(button=>button.addEventListener('click',()=>{
  health=Number(button.dataset.hp);started=true;
  document.querySelectorAll('[data-hp]').forEach(node=>node.setAttribute('aria-pressed',String(node===button)));
  document.getElementById('previewHp').textContent=health+' / 120';document.getElementById('previewBar').value=health;
  document.getElementById('scoreDescription').textContent=descriptions[health];window.MociBattleAudio?.setState('choose',health,false);
 }));
 function sync(){if(started)window.MociBattleAudio?.setState('choose',health,document.hidden||!document.hasFocus());}
 window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);
 document.querySelectorAll('[data-impact]').forEach(button=>button.addEventListener('click',async()=>{
  await window.MociBattleAudio?.previewImpact(button.dataset.impact);
  document.getElementById('impactPreviewStatus').textContent='正在试听：'+button.textContent;
 }));
})();
