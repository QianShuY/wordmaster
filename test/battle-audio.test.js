'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../static/adventure/battle-audio.js'),'utf8');
function setup(saved){
 const nodes=new Map(),events={},windowEvents={},tracks=[],contexts=[],storage=new Map(saved?[['moci-battle-audio-v1',JSON.stringify(saved)]]:[]);let focused=true,frames=new Map(),frameId=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',listeners:{},attrs:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(k,v){this.attrs[k]=v;}});return nodes.get(id);};
 const document={hidden:false,hasFocus:()=>focused,body:{classList:{contains:()=>true}},querySelector:()=>({after(){}}),createElement:()=>({setAttribute(){}}),getElementById:node,addEventListener:(type,fn)=>events[type]=fn};
 class Audio{constructor(){this.volume=0;this.paused=true;this.plays=0;tracks.push(this);}play(){this.plays++;this.paused=false;return this.pending||Promise.resolve();}pause(){this.paused=true;}}
 class Context{constructor(){this.state='running';this.currentTime=0;this.sampleRate=1000;this.oscillators=[];this.buffers=[];contexts.push(this);}createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}},connect(){},disconnect(){}};}createOscillator(){const node={type:'',stopped:false,frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};this.oscillators.push(node);return node;}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}createBufferSource(){const node={connect(){},disconnect(){},start(){},stop(){}};this.buffers.push(node);return node;}createBiquadFilter(){return {frequency:{},connect(){},disconnect(){}};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}}
 const window={AudioContext:Context,addEventListener:(t,f)=>windowEvents[t]=f};
 vm.runInNewContext(script,{window,document,Audio,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>0},requestAnimationFrame:f=>{frames.set(++frameId,f);return frameId;},cancelAnimationFrame:id=>frames.delete(id),console});
 return {api:window.MociBattleAudio,track:tracks[0],tracks,contexts,events,windowEvents,node,storage,document,frames,blur(){focused=false;windowEvents.blur();},focus(){focused=true;windowEvents.focus();},gesture(){events.pointerdown({isTrusted:true,type:'pointerdown'});},frame(now=2000){for(const [id,fn]of [...frames]){frames.delete(id);fn(now);}}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('packaged score layers are audible unclipped PCM with the same loop duration',()=>{
 const frames=[];
 for(const name of ['letters-at-the-mist-bridge.wav','mist-bridge-tension.wav','mist-bridge-last-stand.wav']){
  const b=fs.readFileSync(path.join(__dirname,'../static/adventure/assets',name)),channels=b.readUInt16LE(22),rate=b.readUInt32LE(24);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');assert.equal(b.readUInt16LE(20),1);assert.equal(b.readUInt16LE(34),16);assert.equal(b.readUInt32LE(40),b.length-44);
  let peak=0,power=0;for(let i=44;i<b.length;i+=2){const value=b.readInt16LE(i);peak=Math.max(peak,Math.abs(value));power+=value**2;}
  assert.ok(peak<30000&&peak>10000,name);assert.ok(Math.sqrt(power/((b.length-44)/2))>2000,'Not silence: '+name);
  for(let channel=0;channel<channels;channel++){
   const samples=(b.length-44)/(channels*2),at=i=>b.readInt16LE(44+i*channels*2+channel*2);
   // High-register brass has a larger legitimate per-sample slope than a bass.
   // Compare the seam with its neighboring slopes instead of a fixed bass limit.
   let localStep=0;for(let i=1;i<=32;i++)localStep=Math.max(localStep,Math.abs(at(i)-at(i-1)),Math.abs(at(samples-i)-at(samples-i-1)));
   assert.ok(Math.abs(at(0)-at(samples-1))<=Math.max(1500,localStep*1.5),'No abrupt loop seam: '+name);
  }
  frames.push((b.length-44)/(channels*2));assert.ok(frames.at(-1)/rate>50&&frames.at(-1)/rate<55);
 }
 assert.equal(new Set(frames).size,1,'All health layers must stay on the same bar grid');
});
test('battle audio waits for a gesture, plays in battle and suspends on pause/background',async()=>{
 const s=setup();s.api.setState('choose',120,false);assert.equal(s.track.plays,0);s.gesture();await flush();s.frame(-1);assert.ok(s.tracks.every(a=>a.volume>=0));s.frame();assert.equal(s.track.paused,false);assert.ok(s.track.volume>0&&s.track.volume<.15);
 s.api.result({ok:true,spell:'attack',received:4});assert.ok(s.contexts[0].oscillators.length>=3,'ink attack and recoil both sound');
 s.api.setState('question',120,true);assert.equal(s.track.paused,true);assert.equal(s.track.volume,0);assert.equal(s.contexts[0].state,'suspended');const count=s.contexts[0].oscillators.length;s.api.result({ok:true,spell:'heal'});assert.equal(s.contexts[0].oscillators.length,count);
 s.api.setState('question',120,false);await flush();s.frame();assert.equal(s.track.paused,false);s.blur();assert.equal(s.track.paused,true);s.focus();await flush();s.frame();assert.equal(s.track.paused,false);
 s.windowEvents.pagehide();assert.equal(s.track.paused,true);assert.equal(s.contexts[0].state,'closed');
});
test('music and effects can be independently disabled; even recoil stays silent when effects are off',async()=>{
 const s=setup({music:false,effects:false,musicVolume:0,effectsVolume:0});s.api.setState('choose',120,false);s.gesture();await flush();assert.equal(s.track.plays,0);s.api.result({ok:true,spell:'attack',received:7,shieldBroken:true});assert.equal(s.contexts[0].oscillators.length,0);assert.equal(s.contexts[0].buffers.length,0);
 s.node('battleMusic').listeners.click();await flush();assert.ok(s.track.plays>0);assert.equal(JSON.parse(s.storage.get('moci-battle-audio-v1')).music,true);assert.equal(s.node('battleSfx').attrs['aria-pressed'],'false');
});
test('a late music play response cannot restart a paused or departed battle',async()=>{
 const s=setup();let resolve;s.track.pending=new Promise(r=>resolve=r);s.api.setState('choose',120,false);s.gesture();s.api.setState('question',120,true);resolve();await flush();assert.equal(s.track.paused,true);assert.equal(s.track.volume,0);assert.equal(s.frames.size,0);
});
test('victory ends the battle loop and plays its cadence only once per state transition',async()=>{
 const s=setup();s.api.setState('choose',120,false);s.gesture();await flush();s.api.setState('won',0,false);await flush();s.frame();assert.equal(s.track.paused,true);const count=s.contexts[0].oscillators.length;assert.equal(count,6);s.api.setState('won',0,false);assert.equal(s.contexts[0].oscillators.length,count);
});
test('half health opens the theme, low health replaces tension with the heroic arrangement',async()=>{
 const s=setup();s.api.setState('choose',120,false);s.gesture();await flush();s.frame();const base=s.track.volume;assert.deepEqual(s.tracks.slice(1).map(a=>a.volume),[0,0]);
 s.api.setState('feedback',60,false);await flush();s.frame();assert.ok(s.track.volume<base);assert.ok(s.tracks[1].volume>0);assert.equal(s.tracks[2].volume,0);assert.match(s.node('battleScorePhase').textContent,/逆风起势/);
 s.api.setState('choose',30,false);await flush();s.frame();assert.equal(s.tracks[2].volume,base);assert.equal(s.tracks[1].volume,0,'Tension yields to the counterattack');assert.ok(s.track.volume<base*.2);assert.match(s.node('battleScorePhase').textContent,/破雾反攻/);
 s.blur();assert.ok(s.tracks.every(a=>a.paused&&a.volume===0));
});
