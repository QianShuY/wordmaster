'use strict';
(()=>{
 const heading=document.querySelector('.chapter-heading');if(!heading)return;
 const battle=document.body.classList.contains('battle-page'),key='moci-battle-audio-v1';
 let prefs={music:true,effects:true,musicVolume:22,effectsVolume:38};
 try{const p=JSON.parse(localStorage.getItem(key));for(const k of ['music','effects'])if(typeof p?.[k]==='boolean')prefs[k]=p[k];for(const k of ['musicVolume','effectsVolume'])if(Number.isFinite(p?.[k]))prefs[k]=Math.max(0,Math.min(100,p[k]));}catch{}
 const strip=document.createElement('section');strip.className='battle-score';strip.setAttribute('aria-label','战斗声音');
 strip.innerHTML='<span class="score-name">♫ 雾桥之誓 <small id="battleScorePhase">· 战斗配乐</small></span><button id="battleMusic" type="button">配乐</button><label>音乐<input id="battleMusicVolume" aria-label="战斗配乐音量" type="range" min="0" max="100"><output id="battleMusicValue"></output></label><button id="battleSfx" type="button">音效</button><label>音效<input id="battleSfxVolume" aria-label="战斗音效音量" type="range" min="0" max="100"><output id="battleSfxValue"></output></label><p class="audio-status" id="battleAudioStatus" role="status"></p>';
 const soundMount=document.getElementById('battleAudioMount');
 if(soundMount&&typeof soundMount.append==='function')soundMount.append(strip);else heading.after(strip);
 const musicRevision='20261022-punk-finale2';
 const get=id=>document.getElementById(id),track=new Audio('assets/letters-at-the-mist-bridge.wav?v='+musicRevision);track.loop=true;track.preload='none';track.volume=0;
 const stems=['mist-bridge-tension.wav','mist-bridge-last-stand.wav'].map(file=>{const audio=new Audio('assets/'+file+'?v='+musicRevision);audio.loop=true;audio.preload='none';audio.volume=0;return audio;}),tracks=[track,...stems];
 let ctx,master,unlocked=false,phase=battle?'camp':'preview',hp=120,battlePaused=false,disposed=false,version=0,frame=0,selectedTrack=0;
 const sources=new Set();
 const impactNames=new Set(['ink','break','defend','wound','slam','sweep','storm']),impactLoads=new Map();
 let effectGeneration=0,duckLevel=1,duckFrame=0,duckStart=0,duckEnd=0,duckFrom=1;const levels=[0,0,0];
 const blocked=()=>disposed||document.hidden||!document.hasFocus()||battlePaused;
 const active=()=>!battle||!['camp','won','lost','fallen'].includes(phase);
 const volume=()=>prefs.musicVolume/100*.55;
 // Each file is a complete arrangement, not an additive stem. Only one may play.
 const musicIndex=()=>hp<=30?2:hp<=60?1:0;
 const mix=()=>tracks.map((_,i)=>i===selectedTrack?volume():0);
 function paint(){for(const [id,k,label]of [['battleMusic','music','配乐'],['battleSfx','effects','音效']]){get(id).setAttribute('aria-pressed',String(prefs[k]));get(id).textContent=label+' · '+(prefs[k]?'开':'关');}for(const [id,k,out]of [['battleMusicVolume','musicVolume','battleMusicValue'],['battleSfxVolume','effectsVolume','battleSfxValue']]){get(id).value=prefs[k];get(out).textContent=Math.round(prefs[k])+'%';}}
 function save(){try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}paint();}
 function applyLevels(){tracks.forEach((audio,i)=>audio.volume=levels[i]*duckLevel);}
 function stopEffects(){++effectGeneration;for(const node of sources){try{node.stop();}catch{}}sources.clear();cancelAnimationFrame(duckFrame);duckFrame=0;duckLevel=1;applyLevels();}
 function silence(){levels.fill(0);for(const audio of tracks){audio.pause();audio.volume=0;}}
 function fade(to){cancelAnimationFrame(frame);const targets=Array.isArray(to)?to:[0,0,0],start=performance.now(),from=levels.slice();const step=now=>{if(blocked()){silence();return;}const t=Math.max(0,Math.min(1,(now-start)/1400));targets.forEach((target,i)=>levels[i]=from[i]+(target-from[i])*t);applyLevels();if(t<1)frame=requestAnimationFrame(step);else if(!targets.some(Boolean))tracks.forEach(a=>a.pause());};frame=requestAnimationFrame(step);}
 function duck(at){const start=performance.now()+Math.max(0,at-ctx.currentTime)*1000-35;if(!duckFrame){duckStart=start;duckEnd=start+670;duckFrom=duckLevel;}else{duckStart=Math.min(duckStart,start);duckEnd=Math.max(duckEnd,start+670);}cancelAnimationFrame(duckFrame);function step(now){if(blocked()){duckLevel=1;duckFrame=0;return;}const elapsed=now-duckStart;duckLevel=elapsed<0?duckFrom:elapsed<35?duckFrom+(.48-duckFrom)*elapsed/35:now<duckEnd-480?.48:Math.min(1,.48+.52*(now-(duckEnd-480))/480);applyLevels();if(now<duckEnd)duckFrame=requestAnimationFrame(step);else duckFrame=0;}duckFrame=requestAnimationFrame(step);}
 function loadImpact(name){if(!impactLoads.has(name)){const context=ctx,promise=fetch('assets/impact-'+name+'-v1.wav').then(response=>{if(!response.ok)throw Error('Impact unavailable');return response.arrayBuffer();}).then(bytes=>context.decodeAudioData(bytes));impactLoads.set(name,promise);promise.catch(()=>impactLoads.delete(name));}return impactLoads.get(name);}
 function impact(name,offset=0,level=1){
  if(!impactNames.has(name)||typeof fetch!=='function'||!ctx?.decodeAudioData)return false;
  const generation=effectGeneration,context=ctx,requestedAt=context.currentTime+offset;
  loadImpact(name).then(buffer=>{
   if(generation!==effectGeneration||blocked()||!prefs.effects||ctx!==context||context.state!=='running')return;
   const source=context.createBufferSource(),gain=context.createGain(),at=Math.max(context.currentTime+.003,requestedAt);source.buffer=buffer;gain.gain.value=level;source.connect(gain);gain.connect(master);sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();gain.disconnect();};source.start(at);
   duck(at+({ink:.2,break:.28,defend:.18,wound:.025,slam:.3,sweep:.3,storm:.3})[name]);
  }).catch(()=>{if(generation===effectGeneration&&!blocked()&&prefs.effects)cue(name,true);});return true;
 }
 async function sync(){
  const request=++version;
  if(blocked()){cancelAnimationFrame(frame);silence();stopEffects();if(ctx?.state==='running')ctx.suspend().catch(()=>{});return;}
  if(unlocked&&prefs.effects&&ctx?.state==='suspended')ctx.resume().catch(()=>{});
  if(!unlocked||!prefs.music||!active()){fade(0);return;}
  const index=musicIndex(),audio=tracks[index];
  if(index!==selectedTrack){
   const position=Number.isFinite(tracks[selectedTrack].currentTime)?tracks[selectedTrack].currentTime:0;
   cancelAnimationFrame(frame);silence();selectedTrack=index;
   // The arrangements share a bar grid. Seek the replacement to the same beat,
   // but pause the old track before starting it: there is never a layered mix.
   try{audio.currentTime=position;}catch{}
  }
  tracks.forEach((other,i)=>{if(i!==index){other.pause();other.volume=0;levels[i]=0;}});
  try{await audio.play();if(request!==version){if(blocked()||!prefs.music||!active())silence();else if(selectedTrack!==index){audio.pause();audio.volume=0;levels[index]=0;}return;}
   get('battleAudioStatus').textContent='';fade(mix());}
  catch{if(request===version){silence();get('battleAudioStatus').textContent='配乐尚未播放，点击「配乐」重试。';}}
 }
 function unlock(){if(disposed||blocked())return;unlocked=true;const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!ctx&&AudioCtx){try{ctx=new AudioCtx();master=ctx.createGain();master.gain.value=prefs.effectsVolume/100*.5;master.connect(ctx.destination);if(typeof fetch==='function'&&ctx.decodeAudioData)for(const name of impactNames)loadImpact(name).catch(()=>{});}catch{get('battleAudioStatus').textContent='当前设备暂不支持战斗音效。';}}if(ctx?.state==='suspended')ctx.resume().catch(()=>{});}
 function tone(frequency,offset,duration,level=.3,type='sine',endFrequency=frequency){
  if(!ctx||ctx.state!=='running')return;const at=ctx.currentTime+offset,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),at+duration);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0001,level),at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(master);sources.add(o);o.onended=()=>{sources.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+duration+.02);
 }
 function air(offset,duration,level,frequency=1000){if(!ctx||ctx.state!=='running')return;const n=Math.round(ctx.sampleRate*duration),buffer=ctx.createBuffer(1,n,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/n)**2;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=level;source.connect(filter);filter.connect(gain);gain.connect(master);sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(ctx.currentTime+offset);}
 function cue(name,fallback=false){
  if(!unlocked||blocked()||!prefs.effects||!ctx||ctx.state!=='running')return;
  if(!fallback&&impact(name))return;
  if(name==='ink'||name==='sweep'){air(0,.25,.23,1900);tone(680,.06,.22,.18,'triangle',130);tone(95,.19,.27,.32);}
  else if(name==='defend'){air(0,.15,.12,2600);[440,660,880].forEach((f,i)=>tone(f,i*.025,.4,.12,'sine'));}
  else if(name==='break'){air(0,.55,.32,1600);tone(83,0,.65,.42,'triangle',36);[930,1330,1770].forEach((f,i)=>tone(f,.04+i*.045,.32,.09,'sine',f*.7));}
  else if(name==='wound'){air(0,.21,.3,650);tone(110,0,.26,.4,'triangle',43);}
  else if(name==='heal'||name==='revive'){[293.66,349.23,440,587.33,698.46].forEach((f,i)=>tone(f,i*.12,.85,.14));if(name==='revive')tone(146.83,0,1.5,.16);}
  else if(name==='victory'){[293.66,349.23,440,587.33,698.46,880].forEach((f,i)=>tone(f,.55+i*.14,1.5,.13,'triangle'));}
  else if(name==='fallen'){[146.83,110,73.42].forEach((f,i)=>tone(f,i*.23,.7,.2,'triangle'));}
  else if(name==='charge'){air(0,.8,.11,500);tone(73.42,0,.9,.15,'triangle',110);}
  else if(name==='slam'){air(0,.5,.3,820);tone(65,0,.7,.4,'sine',30);}
  else if(name==='storm'){air(0,1.5,.23,1800);[98,146.83].forEach(f=>tone(f,0,1.3,.12,'triangle'));}
 }
 window.MociBattleAudio={
  setState(next,bossHp,paused){const previous=phase;phase=next;hp=bossHp;battlePaused=paused===true;get('battleScorePhase').textContent=phase==='won'?'· 雾桥已开':phase==='camp'?'· 静候启程':hp<=30?'· 破雾反攻':hp<=60?'· 逆风起势':'· 守望雾桥';if(previous!==phase){if(phase==='won')cue('victory');if(phase==='fallen'||phase==='lost')cue('fallen');}sync();},
  result(r,revive){if(!unlocked||blocked()||!prefs.effects)return;
   if(revive){cue('revive');return;}
   const incoming=({attack:'sweep',sealSlam:'slam',storm:'storm'})[r.motion]||'wound';
   if(!r.ok)cue(incoming);else if(r.spell==='attack')cue(r.shieldBroken?'break':'ink');else cue(r.spell);
   if(r.ok&&r.received){if(!impact('wound',.36,.65))tone(67,.36,.22,.15,'sine',39);}
  },
  async previewImpact(name){if(!impactNames.has(name))return;unlock();if(ctx?.state==='suspended')try{await ctx.resume();}catch{return;}stopEffects();cue(name);}
 };
 for(const [id,k]of [['battleMusic','music'],['battleSfx','effects']])get(id).addEventListener('click',()=>{unlock();if(id==='battleMusic'&&get('battleAudioStatus').textContent){prefs.music=true;get('battleAudioStatus').textContent='';}else prefs[k]=!prefs[k];save();if(!prefs.effects)stopEffects();sync();if(k==='effects'&&prefs.effects)cue('defend');});
 for(const [id,k]of [['battleMusicVolume','musicVolume'],['battleSfxVolume','effectsVolume']])get(id).addEventListener('input',event=>{prefs[k]=Number(event.target.value);if(master)master.gain.setTargetAtTime(prefs.effectsVolume/100*.5,ctx.currentTime,.04);save();sync();});
 // Capture the gesture before asynchronous session creation; no unsolicited autoplay.
 function gesture(event){if(!event.isTrusted||event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(!unlocked){unlock();sync();}}
 document.addEventListener('pointerdown',gesture,true);document.addEventListener('keydown',gesture,true);
 // In actual battle the result owns its sound once; motion events only drive the
 // action notebook. This prevents duplicated impacts on one successful break.
 document.addEventListener('moci-boss-state',event=>{if(battle)return;const state=event.detail;if(['charge','sealCharge','stormCharge'].includes(state))cue('charge');else if(state==='attack')cue('sweep');else if(state==='sealSlam')cue('slam');else if(state==='storm')cue('storm');else cue(({hit:'ink',break:'break',vanish:'victory'})[state]);});
 document.addEventListener('visibilitychange',sync);window.addEventListener('blur',sync);window.addEventListener('focus',sync);
 window.addEventListener('pagehide',()=>{disposed=true;++version;cancelAnimationFrame(frame);silence();stopEffects();ctx?.close().catch(()=>{});});
 paint();
})();
