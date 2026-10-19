'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(require.resolve('../static/adventure/ending-audio.js'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(saved={},blockedAutoplay=false){
 const listeners={},events={},frames=new Map(),nodes=new Map(),store=new Map(Object.entries(saved));let serial=0,now=0,replays=0,audio,controller;
 function node(id){const n={value:22,textContent:'',events:{},attrs:{},addEventListener(k,fn){this.events[k]=fn;},setAttribute(k,v){this.attrs[k]=v;}};nodes.set(id,n);return n;}
 const button=node('music'),slider=node('volume');node('endingAudioStatus');
 const document={hidden:false,getElementById:id=>nodes.get(id),addEventListener:(name,fn)=>events[name]=fn};
 class AudioMock{constructor(url){this.url=url;this.currentTime=0;this.paused=true;this.volume=0;this.events={};audio=this;}addEventListener(k,fn){this.events[k]=fn;}play(){if(blockedAutoplay)return Promise.reject(Error('gesture required'));this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
 const window={addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{window,document,Audio:AudioMock,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),performance:{now:()=>now}});
 controller=window.MociEndingAudio.attach(button,slider,()=>{replays++;controller.restart();});
 return{audio,controller,button,slider,document,events,listeners,store,frames,get replays(){return replays;},allow(){blockedAutoplay=false;},at(time){now=time;const calls=[...frames.values()];frames.clear();for(const fn of calls)fn(time);}};
}
test('autoplay refusal offers an explicit music gesture and replays the scene in sync',async()=>{
 const ui=setup({},true);ui.controller.restart();await flush();assert.match(ui.button.textContent,/开启配乐/);assert.equal(ui.frames.size,0);
 ui.allow();ui.button.events.click();await flush();assert.equal(ui.replays,1);assert.equal(ui.audio.paused,false);assert.match(ui.button.textContent,/配乐 · 开/);ui.at(1200);assert.ok(ui.audio.volume>.1&&ui.audio.volume<.2);
 ui.button.events.click();assert.equal(ui.audio.paused,true);assert.equal(ui.audio.volume,0);assert.equal(JSON.parse(ui.store.get('moci-ending-audio-v1')).enabled,false);
});
test('letter reading lowers the cue, background and page exit silence it, and focus resumes without restarting',async()=>{
 const ui=setup();ui.controller.restart();await flush();ui.at(1200);const full=ui.audio.volume;
 ui.controller.read();ui.at(2400);assert.ok(ui.audio.volume<full/2);
 ui.audio.currentTime=23;ui.document.hidden=true;ui.events.visibilitychange();assert.equal(ui.audio.paused,true);assert.equal(ui.frames.size,0);
 ui.document.hidden=false;ui.events.visibilitychange();await flush();assert.equal(ui.audio.currentTime,23);assert.equal(ui.audio.paused,false);
 ui.listeners.pagehide();assert.equal(ui.audio.paused,true);assert.equal(ui.audio.volume,0);
});
test('respects the battle mute preference; ending track ends naturally, replay returns to the beginning',async()=>{
 const ui=setup({'moci-battle-audio-v1':JSON.stringify({music:false,musicVolume:15})});ui.controller.restart();await flush();assert.equal(ui.audio.paused,true);assert.equal(ui.audio.loop,false);
 ui.button.events.click();await flush();assert.equal(ui.audio.paused,false);ui.audio.currentTime=53;ui.audio.events.ended();assert.match(ui.button.textContent,/重听终章/);
 ui.button.events.click();await flush();assert.equal(ui.audio.currentTime,0);assert.equal(ui.replays,2);
});
test('the original ending cue has stereo headroom and fades into silence rather than looping a cut',()=>{
 const b=fs.readFileSync(path.join(__dirname,'../static/adventure/assets/beyond-the-mist-v1.wav'));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt16LE(22),2);assert.equal(b.readUInt32LE(24),22050);assert.equal((b.length-44)/(22050*4),53);
 let peak=0,power=0,tail=0;for(let i=44;i<b.length;i+=2){const v=b.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));power+=v*v;if(i>b.length-2205*4)tail=Math.max(tail,Math.abs(v));}
 assert.ok(peak>.7&&peak<.75);assert.ok(Math.sqrt(power/((b.length-44)/2))>.08);assert.ok(tail<.02);assert.equal(b.readInt16LE(b.length-2),0);
});
