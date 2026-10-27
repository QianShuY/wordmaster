'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),B=require('../shared/boss-battle');
const source=fs.readFileSync(require.resolve('../static/adventure/battle.js'),'utf8');
const pool=Array.from({length:80},(_,i)=>({id:i+1,answer:'word'+i,meaning:'词义'+i,pos:'n.',choices:['词义'+i,'甲','乙','丙']}));
const key='moci-boss-formal-v1:client-fixture';
function checkpoint(phase='partial'){
 const initial=B.create(pool,'client-fixture').snapshot(),game=B.create(pool,'client-fixture',initial),events=[];
 const act=(action,...args)=>{assert.ok(game[action](...args));events.push({action,args});};
 act('teach',B.DECLARATION);act('start');
 if(phase==='partial'){act('choose','attack');act('answer',game.question.answer,false);}
 else while(game.state.phase!=='won'){
  if(game.state.phase==='feedback')act('next');
  else if(game.state.phase==='choose')act('choose','defend');
  else if(game.state.phase==='stormIntro')act('elapseDomain',Math.min(1000,game.state.domain.introMs));
  else act('answer',game.question.mode==='meaning'?game.question.meaning:game.question.answer,false);
  if(phase==='domain'&&game.state.domain?.introMs===0){act('answer',game.question.answer,false);break;}
 }
 return {session:{id:'saved-fight',pool,initial,result:null},saved:{sessionId:'saved-fight',events,battle:game.snapshot(),limit:0,seconds:0,domainElapsed:0},game};
}
async function setup({fixture=checkpoint(),live=pool,failSession=false,finish}={}){
 const nodes=new Map(),events={},windowEvents={},requests=[],frames=new Map(),storage=new Map();let frameId=0,now=0;
 if(fixture)storage.set(key,JSON.stringify(fixture.saved));
 function node(id){
  const n={id,dataset:{},hidden:false,attrs:{},listeners:{},textContent:'',value:'',disabled:false,scrollTop:0,
   setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(k,v){this.listeners[k]=v;},
   querySelectorAll(){return [];},querySelector(){return null;},focus(){},insertAdjacentHTML(){},before(){},click(){return this.listeners.click?.();}};
  let html='';Object.defineProperty(n,'innerHTML',{get:()=>html,set:v=>{html=v;for(const m of v.matchAll(/id="([^"]+)"/g))node(m[1]);}});
  nodes.set(id,n);return n;
 }
 const html=fs.readFileSync(require.resolve('../static/adventure/battle.html'),'utf8');for(const m of html.matchAll(/id="([^"]+)"/g))node(m[1]);
 const heading=node('heading'),desk=node('desk');
 const document={hidden:false,body:{dataset:{}},hasFocus:()=>true,getElementById:id=>nodes.get(id),
  querySelector:selector=>selector==='.spell-desk'?desk:heading,addEventListener:(k,f)=>events[k]=f,dispatchEvent(){},createElement:()=>node('created')};
 const location={search:'',href:''};
 const fetch=async(url,options={})=>{
  requests.push({url,...options});
  if(url==='/api/adventure/campaign')return {ok:true,json:async()=>({bossAvailable:true})};
  if(url==='/api/adventure/pool')return {ok:true,json:async()=>({instanceId:'client-fixture',words:live})};
  if(url.endsWith('/finish'))return finish(requests.filter(r=>r.url.endsWith('/finish')).length);
  return {ok:!failSession,json:async()=>fixture.session};
 };
 await vm.runInNewContext(source,{window:{MociBossBattle:B,addEventListener:(k,f)=>windowEvents[k]=f},document,location,URLSearchParams,fetch,
  localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{now:()=>now},CustomEvent:class{},
  requestAnimationFrame:f=>{frames.set(++frameId,f);return frameId;},cancelAnimationFrame:id=>frames.delete(id)});
 return {nodes,requests,storage,location,windowEvents,document,
  saved:()=>JSON.parse(storage.get(key)),at(time){now=time;for(const [id,fn]of [...frames]){frames.delete(id);fn(time);}}};
}

test('formal resume uses its frozen roster before checking a changed live roster',async()=>{
 const fixture=checkpoint(),ui=await setup({fixture,live:[]});
 assert.match(ui.nodes.get('battleContent').innerHTML,/英文咒语/);
 assert.equal(ui.nodes.get('bossHp').textContent,'240 / 240');
 assert.equal(ui.saved().battle.chain,1);assert.equal(ui.saved().battle.cursor,fixture.saved.battle.cursor);
 assert.equal(ui.saved().sessionId,'saved-fight');assert.deepEqual(ui.saved().events,fixture.saved.events);
 assert.ok(ui.requests.some(r=>r.url.endsWith('/saved-fight')));
 assert.equal(ui.requests.some(r=>r.method==='POST'),false);
});

test('a new fight still requires ten live learned words; failed resume retains the saved transcript',async()=>{
 const fresh=await setup({fixture:null,live:[]});assert.match(fresh.nodes.get('battleContent').innerHTML,/至少学过 10/);
 const fixture=checkpoint(),ui=await setup({fixture,live:[],failSession:true});
 assert.match(ui.nodes.get('battleContent').innerHTML,/刷新重试/);
 ui.windowEvents.pagehide();assert.deepEqual(ui.saved(),fixture.saved);
 assert.equal(ui.requests.some(r=>r.method==='POST'),false);
});

test('a restored storm keeps its seals and remaining time through pause and resume',async()=>{
 const fixture=checkpoint('domain'),ui=await setup({fixture});
 const remaining=ui.saved().battle.domain.remainingMs;
 assert.equal(ui.saved().battle.domain.solved.length,1);
 ui.at(1000);assert.equal(ui.saved().battle.domain.remainingMs,remaining-1000);
 ui.nodes.get('battlePause').click();ui.at(11000);assert.equal(ui.saved().battle.domain.remainingMs,remaining-1000);
 ui.nodes.get('resumeBattle').click();ui.at(12000);assert.equal(ui.saved().battle.domain.remainingMs,remaining-2000);
 assert.equal(ui.saved().battle.domain.solved.length,1);
});

test('a failed ending request retries exactly the same victory transcript; settled reload only reads',async()=>{
 const fixture=checkpoint('won'),result={ok:true,firstClear:true,ending:{title:'fixture'}};
 const ui=await setup({fixture,finish:async attempt=>({ok:attempt>1,json:async()=>attempt===1?{error:'连接中断'}:result})});
 await ui.nodes.get('sealEnding').click();assert.match(ui.nodes.get('endingStatus').textContent,/手记已保留/);
 assert.equal(ui.nodes.get('sealEnding').disabled,false);assert.equal(ui.location.href,'');
 await ui.nodes.get('sealEnding').click();assert.equal(ui.location.href,'ending.html');
 const posts=ui.requests.filter(r=>r.method==='POST');assert.equal(posts.length,2);assert.equal(posts[0].body,posts[1].body);
 assert.deepEqual(JSON.parse(posts[0].body).events,fixture.saved.events);
 fixture.session.result=result;fixture.saved=ui.saved();const reload=await setup({fixture,live:[]});
 await reload.nodes.get('sealEnding').click();assert.equal(reload.location.href,'ending.html');
 assert.equal(reload.requests.some(r=>r.method==='POST'),false);
});
