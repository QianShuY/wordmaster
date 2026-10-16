'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Domain=require('../shared/domain'),Checkpoint=require('../shared/desktop-checkpoint');
test('23 new words complete three linked recognition-choice-spelling groups without early campaign claims',async()=>{
 const elements=new Map(),requests=[],saved=[];
 const $=key=>{if(!elements.has(key))elements.set(key,{textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},after(){},remove(){},insertAdjacentHTML(){}});return elements.get(key);};
 const context=vm.createContext({Set,Domain,DesktopCheckpoint:Checkpoint,IS_ANDROID_APP:false,$,esc:String,wordHeadword:w=>w.word,
  localStorage:{setItem(){}},location:{hash:'#/today-study/1'},document:{createElement:()=>({setAttribute(){}})},
  api:async url=>{requests.push(url);return {drawn_today:true};},showPageLoading(){},clearPageStatus(){},showPageError(){}});
 const source=fs.readFileSync(require.resolve('../static/app.js'),'utf8'),start=source.indexOf('const Study = {'),end=source.indexOf('\n};',start)+3;
 vm.runInContext(source.slice(start,end)+';globalThis.study=Study;',context);
 const study=context.study,learn=Array.from({length:23},(_,i)=>({id:i+1,word:'word'+String.fromCharCode(97+i),is_new:1}));
 Object.assign(study,{bookId:1,todayFlow:{stage:'learn',learn,review:[],learnTotal:23,reviewTotal:0,learnGroupSize:10,learnGroupStart:0,completed:{learn:0,choice:0,spelling:0,review:0},deferred:[]},leave(){},renderTodayJourney(){},saveTodayCheckpoint(){saved.push({stage:this.todayFlow.stage,start:this.todayFlow.learnGroupStart});},begin(words){this.roundWords=words;this.total=words.length;this.done=0;},learnAgainIds:new Set(),deferredIds:new Set(),firstCorrectCount:0,retryCorrectCount:0,wrongCount:0,abandonedCount:0});
 study.continueToday('learn');
 for(const size of [10,10,3]){
  const identities=study.roundWords.map(w=>w.id);assert.equal(identities.length,size);
  for(const stage of ['learn','choice','spelling']){
   assert.equal(study.todayFlow.stage,stage);assert.deepEqual(study.roundWords.map(w=>w.id),identities);
   study.done=size;await study.finish();
   if(stage!=='spelling')$('#doneAgain').onclick();
  }
  if(size===10){assert.equal(requests.filter(x=>x.includes('complete-day')).length,0);assert.match($('#doneAgain').textContent,/下一组/);$('#doneAgain').onclick();}
 }
 assert.deepEqual(study.todayFlow.completed,{learn:23,choice:23,spelling:23,review:0});
 assert.equal(requests.filter(x=>x.includes('complete-day')).length,1);
 assert.deepEqual(saved.map(s=>s.start),[0,0,0,10,10,10,20,20,20]);
});
test('group slices preserve the original manifest and legacy sessions keep their current manifest',()=>{
 const learn=Array.from({length:23},(_,i)=>({id:i+1,word:'test'})),flow={learn,learnGroupSize:10,learnGroupStart:10,deferred:[]};
 const group=Checkpoint.learnGroup(flow);group.shift();assert.equal(learn.length,23);
 assert.equal(Checkpoint.stageOffset(flow,'learn'),10);assert.equal(Checkpoint.stageOffset(flow,'spelling'),10);
 assert.equal(Checkpoint.learnGroup({learn}).length,23);
 flow.learn[0]={id:1,word:'test 1',answer_word:'test'};
 assert.equal(Checkpoint.stageOffset(flow,'spelling'),10,'spelling uses the reviewed answer word');
});
