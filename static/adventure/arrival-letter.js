'use strict';
(()=>{
 const dialog=document.getElementById('arrivalLetter'),open=document.getElementById('breakSeal'),accept=document.getElementById('acceptLetter');
 const key='moci-arrival-letter-v1';
 function present(){dialog.classList.remove('letter-open');document.getElementById('letterPages').hidden=true;open.hidden=false;dialog.showModal();open.focus();}
 function dismiss(){try{localStorage.setItem(key,'read');}catch{}dialog.close();document.body.classList.remove('intro-pending');document.getElementById('continueJourney').focus({preventScroll:true});}
 open.addEventListener('click',()=>{dialog.classList.add('letter-open');open.hidden=true;document.getElementById('letterPages').hidden=false;accept.focus({preventScroll:true});});
 accept.addEventListener('click',dismiss);
 dialog.addEventListener('cancel',event=>{event.preventDefault();if(dialog.classList.contains('letter-open'))dismiss();});
 document.getElementById('rereadLetter').addEventListener('click',present);
 function enter(){
  let seen=false;try{seen=localStorage.getItem(key)==='read';}catch{}
  if(!seen&&!dialog.open)present();
 }
 window.MociArrivalLetter={enter};
})();
