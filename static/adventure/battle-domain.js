'use strict';
// Separate, persistent depth lanes: answering never rebuilds or restarts the storm.
(()=>{
 const field=document.getElementById('realmPages');if(!field)return;
 for(let i=0;i<48;i++){
  const lane=document.createElement('span'),page=document.createElement('i');
  lane.className='realm-page-lane';page.className='realm-page';
  // Deliberately uneven spacing, depth and timing keep this from reading as a grid.
  const side=i%2===0?-1:1,depth=i%4;
  lane.style.cssText=`--x:${side*(24+(i*17)%31)}vw;--y:${-42+(i*31)%84}vh;--size:${18+depth*14+(i*7)%15}px;--speed:${9+(i*13)%11}s;--delay:${-((i*29)%170)/10}s;--tilt:${-70+(i*43)%140}deg;--drift:${side*(8+(i*7)%14)}vw;--depth:${.3+depth*.38};--alpha:${.22+depth*.18}`;
  lane.append(page);field.append(lane);
 }
})();
