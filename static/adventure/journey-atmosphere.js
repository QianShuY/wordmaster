'use strict';
// Map atmosphere: smoke, water, birds and mist. Audio lives in journey-music.js.
(()=>{
 const layer=document.querySelector('.world-atmosphere');
 const smoke=(x,y,scale=1)=>`<span class="village-smoke" style="left:${x}%;top:${y}%;--smoke-scale:${scale}">${[0,1,2,3].map(i=>`<i style="--puff-delay:${-i*3}s"></i>`).join('')}</span>`;
 const water=(x,y,w,angle)=>`<span class="living-water" style="left:${x}%;top:${y}%;width:${w}%;--water-angle:${angle}deg">${[0,1,2,3,4].map(i=>`<i style="--ripple:${i};--ripple-delay:${-i*1.7}s"></i>`).join('')}</span>`;
 layer.insertAdjacentHTML('beforeend',smoke(8.5,75.4,.7)+smoke(40,52.1,.8)+smoke(83.4,34.4,.55)+water(62,71,8,-6)+water(80,87,9,8)+water(12,18,9,-4)+water(85,78,6,12)+`<span class="camp-embers" style="left:40%;top:54.2%"><i></i><i></i><i></i></span><span class="camp-embers" style="left:83%;top:35.8%"><i></i><i></i><i></i></span>`);
 layer.insertAdjacentHTML('afterbegin',`<svg class="river-motion" viewBox="0 0 1536 1024" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="movingWater"><path d="M40 173L142 164 184 161 194 204 232 252 292 272 359 249 398 218 411 232 393 280 350 326 289 343 236 314 210 283 155 262 84 249Z M708 763L794 747 875 758 951 752 1011 768 1023 782 967 797 878 787 823 783 779 777Z M1156 752L1227 736 1301 741 1330 772 1287 785 1218 787 1170 777Z M934 811L1036 815 1110 813 1133 832 1083 847 1019 842 945 838Z M1197 827L1316 824 1390 865 1416 922 1441 978 1386 1000 1324 973 1291 950 1217 931 1177 918 1124 913 1117 897 1187 895 1231 918 1303 926 1343 950 1371 943 1357 907 1322 889 1308 863 1226 851Z"/></clipPath><filter id="waterDisplace" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".015 .07" numOctaves="1" seed="8"><animate attributeName="baseFrequency" values=".015 .07;.016 .073;.015 .07" dur="14s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale=".8" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g clip-path="url(#movingWater)"><image href="assets/mist-campaign-map-v4-dusk.webp" width="1536" height="1024" filter="url(#waterDisplace)"/></g><path class="waterfall-stream" d="M218 566q-4 24 15 42m769-142q-5 26 11 38m145 75q8 34 26 43"/></svg>`);
 // Individual silhouettes depart the foreground and recede toward the pass.
 layer.querySelector('.map-birds')?.remove();
 // Each silhouette owns its route and clock; there is no shared V or row grid.
 const flights=[
  [43,13,49,-8,-29,78,.85,-6],[68,8,63,-37,-45,84,1.05,4],
  [81,19,57,-21,-21,69,.78,8],[57,17,71,-49,-38,76,.94,-3],
  [74,11,53,-12,-57,85,1.1,6],[36,24,66,-32,-12,64,.82,-8],
  [89,15,61,-44,-37,81,.9,3],[62,25,77,-18,-26,62,.74,-5],
  [49,7,59,-39,-35,89,.97,7],[77,23,69,-55,-15,70,.86,-2],
  [54,20,64,-25,-43,74,1.02,5]
 ];
 layer.insertAdjacentHTML('beforeend',flights.map(([x,y,d,delay,dx,dy,size,angle],i)=>`<svg class="geese-flock geese-solo" viewBox="-11 -8 22 17" style="left:${x}%;top:${y}%;--flight-time:${d}s;--flight-delay:${delay}s;--near-x:${dx}cqw;--near-y:${dy}cqh;--bird-size:${size};--bird-angle:${angle}deg" aria-hidden="true"><g class="goose-individual" style="--bird-time:${4.1+i*.37}s;--bird-delay:${-i*.73}s;--bird-rise:${i%2?1.3:-1.1}px;--bird-drift:${i%3?.8:-1.2}px"><path class="goose-body" d="M0-3Q1-2 .6 0Q1.6 2 .5 4L0 6-.5 4Q-1.6 2-.6 0Q-1-2 0-3Z"/><path class="goose-wing goose-left" style="--wing-time:${1.45+(i%7)*.12}s;animation-delay:${-i*.37}s" d="M0 1Q-3-2-7 0"/><path class="goose-wing goose-right" style="--wing-time:${1.45+(i%7)*.12}s;animation-delay:${-i*.37-.14}s" d="M0 1Q4-2 7 0"/></g></svg>`).join('')+`<i class="mountain-veil veil-peaks"></i><i class="mountain-veil veil-pass"></i><i class="mountain-veil veil-bridge"></i>`);
 const river=layer.querySelector('.river-motion');
 const map=document.querySelector('.world-map'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let leaving=false;
 const syncMotion=()=>{const paused=map.classList.contains('wind-paused')||document.hidden||reduced.matches||leaving;map.classList.toggle('motion-suspended',paused);paused?river.pauseAnimations():river.unpauseAnimations();};
 document.addEventListener('moci-map-motion-change',syncMotion);
 document.addEventListener('visibilitychange',syncMotion);
 reduced.addEventListener('change',syncMotion);
 window.addEventListener('pagehide',()=>{leaving=true;syncMotion();});
 window.addEventListener('pageshow',()=>{leaving=false;syncMotion();});syncMotion();

})();
