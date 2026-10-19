'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../static/adventure/ending.js'),'utf8');
const {STORY}=require('../app/chapter-ending');
const ending={...STORY,completedAt:'2026-10-19',summary:{answered:18,correct:16,revived:true}};
async function setup(payload={ending},reduce=false){
 const nodes=new Map(),events={},windowEvents={},frames=new Map(),requests=[];let serial=0,mediaChange;
 const document={hidden:false,body:{},activeElement:null,addEventListener:(name,fn)=>events[name]=fn,getElementById:id=>nodes.get(id)||null};
 function node(id){
  const classes=new Set(),n={id,hidden:false,dataset:{},style:{setProperty(k,v){this[k]=v;}},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},setAttribute(k,v){this[k]=v;},focus(){document.activeElement=n;},querySelector(){return null;},offsetWidth:1200};
  let html='';Object.defineProperty(n,'innerHTML',{get:()=>html,set:value=>{html=value;for(const match of value.matchAll(/id="([^"]+)"/g))if(!nodes.has(match[1]))node(match[1]);}});nodes.set(id,n);return n;
 }
 node('endingContent');
 const media={matches:reduce,addEventListener:(_,fn)=>mediaChange=fn};
 const context={document,window:{matchMedia:()=>media,addEventListener:(name,fn)=>windowEvents[name]=fn,scrollTo(){}},AbortController,setTimeout,clearTimeout,requestAnimationFrame:fn=>{frames.set(++serial,fn);return serial;},cancelAnimationFrame:id=>frames.delete(id),fetch:async(url,options)=>{requests.push({url,options});return{ok:true,json:async()=>payload};}};
 vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 return{nodes,events,windowEvents,document,requests,frames,at(now){const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(now);},setReduced(){media.matches=true;mediaChange();}};
}
test('uncleared and invalid records never expose the epilogue or start an animation',async()=>{
 for(const payload of [{ending:null},{ending:{...ending,summary:{answered:-1,correct:16,revived:false}}},{}]){
  const ui=await setup(payload);assert.equal(ui.nodes.has('endingScene'),false);assert.equal(ui.frames.size,0);assert.equal(ui.nodes.get('endingContent')['aria-busy'],'false');
 }
});
test('the complete epilogue reaches its letter, can be replayed and never writes a clear record',async()=>{
 const ui=await setup(),scene=ui.nodes.get('endingScene');
 ui.at(0);ui.at(4300);assert.equal(scene.dataset.act,'voice');ui.at(9200);assert.equal(scene.dataset.act,'dawn');ui.at(15000);assert.equal(scene.dataset.act,'rest');assert.equal(ui.frames.size,0);
 assert.equal(ui.nodes.get('endingArrival').hidden,false);
 ui.nodes.get('readEnding').onclick();assert.equal(scene.hidden,true);assert.equal(ui.nodes.get('endingLetterView').hidden,false);assert.equal(ui.document.activeElement.id,'endingTitle');
 ui.nodes.get('backToScene').onclick();assert.equal(scene.hidden,false);assert.equal(ui.document.activeElement.id,'readEnding');
 ui.nodes.get('replayEnding').onclick();assert.equal(scene.dataset.act,'silence');assert.equal(ui.nodes.get('endingLetterView').hidden,true);
 ui.nodes.get('skipEnding').onclick();assert.equal(scene.dataset.act,'rest');assert.equal(ui.document.activeElement.id,'readEnding');assert.equal(ui.frames.size,0);
 assert.equal(ui.requests.length,1);assert.equal(ui.requests[0].url,'/api/adventure/ending');assert.equal(ui.requests[0].options.method,undefined);
});
test('backgrounding pauses the story clock; Escape finishes it without losing the letter',async()=>{
 const ui=await setup(),scene=ui.nodes.get('endingScene');ui.at(0);ui.at(2000);
 ui.document.hidden=true;ui.events.visibilitychange();assert.equal(ui.frames.size,0);assert.equal(scene.classList.contains('is-playing'),false);
 ui.document.hidden=false;ui.events.visibilitychange();ui.at(100000);assert.equal(scene.dataset.act,'silence');ui.at(102300);assert.equal(scene.dataset.act,'voice');
 let prevented=false;ui.events.keydown({key:'Escape',preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(scene.dataset.act,'rest');assert.equal(ui.frames.size,0);
});
test('reduced motion opens the complete scene immediately and stops an in-progress scene',async()=>{
 const ui=await setup({ending},true);assert.equal(ui.nodes.get('endingScene').dataset.act,'rest');assert.equal(ui.frames.size,0);ui.nodes.get('replayEnding').onclick();assert.equal(ui.frames.size,0);
 const live=await setup();live.setReduced();assert.equal(live.nodes.get('endingScene').dataset.act,'rest');assert.equal(live.frames.size,0);
});
