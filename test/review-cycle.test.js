'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-recall-cycle-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {app,db}=require('../app/main');
test('meaning alone cannot advance; spelling failure resets and requires two correct recalls; unfinished cycles survive new sessions',async t=>{
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(async()=>{server.close();await once(server,'close');db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;
 db.exec("INSERT INTO wordbooks(id,name,daily_new,plan_mode) VALUES(1,'test',1,'daily'); INSERT INTO words(id,book_id,word,meaning,pos) VALUES(1,1,'bridge','桥','n.'); INSERT INTO progress(word_id,review_level,first_studied,next_due) VALUES(1,2,datetime('now','localtime','-4 days'),datetime('now','localtime','-1 day'))");
 let index=0;const cycle='cycle-first-12345';
 const post=async(mode,correct,options={})=>{
  const payload={word_id:1,correct,is_new:false,request_id:'request-cycle-'+(++index),session_id:'session-cycle-12345',outcome:correct?'first_correct':'wrong',judgement_mode:mode,review_cycle:cycle,...options};
  const r=await fetch(base+'/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  assert.equal(r.status,200);return {result:await r.json(),payload};
 };
 const progress=()=>db.prepare('SELECT * FROM progress WHERE word_id=1').get();
 const before=progress();const meaning=await post('meaning',true);
 assert.equal(progress().review_level,2);assert.equal(progress().next_due,before.next_due);
 const state=await (await fetch(base+'/api/adventure/campaign')).json();assert.equal(state.books[0].recallPending,1);assert.equal(state.books[0].ready,false);
 await post('spelling',false);assert.equal(progress().review_level,0);
 await post('spelling',true,{session_id:'session-reopened-123',review_cycle:'cycle-reopened-123'});
 assert.equal(progress().review_level,0);assert.equal(JSON.parse(db.prepare('SELECT state_json FROM recall_cycles').get().state_json).complete,false);
 const final=await post('spelling',true,{session_id:'session-reopened-123',review_cycle:'cycle-reopened-123'});
 assert.equal(progress().review_level,1);assert.equal(JSON.parse(db.prepare('SELECT state_json FROM recall_cycles').get().state_json).complete,true);
 const due=progress().next_due;
 const duplicate=await fetch(base+'/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(final.payload)});
 assert.equal((await duplicate.json()).duplicate,true);assert.equal(progress().next_due,due);
 await post('meaning',true);assert.equal(progress().next_due,due);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM review_log').get().n,5);
});
test('new-word consolidation and old recall both wait for the server-required second correct answer after one failure',async()=>{
 const vm=require('node:vm'),source=fs.readFileSync(require.resolve('../static/app.js'),'utf8');
 let streak=1,mode='spelling';
 const context=vm.createContext({Set,IS_ANDROID_APP:false,
  api:async()=>({outcome:'retry_correct',memory:{recall_cycle:{[mode]:{errors:1,streak}}}}),
  window:{WordMasterReinforcement:require('../shared/reinforcement')},$:()=>null});
 const start=source.indexOf('const Study = {'),end=source.indexOf('\n};',start)+3;
 vm.runInContext(source.slice(start,end)+';globalThis.study=Study;',context);
 const study=context.study,word={id:1,word:'bridge'};
 for(const stage of ['review-spelling','spelling','choice','review']){
 streak=1;mode=['review','choice'].includes(stage)?'meaning':'spelling';
 Object.assign(study,{todayFlow:{stage},mode,current:word,total:1,done:0,queue:[],reinforcement:{},renderMemory(){},updateProgress(){},saveTodayCheckpoint(){}});
 await study.report({word_id:1,correct:true,outcome:'retry_correct'});
 assert.equal(study.done,0);assert.equal(study.reinforcement[1].required,2);assert.equal(study.queue.length,1);
 streak=2;await study.report({word_id:1,correct:true,outcome:'retry_correct'});
 assert.equal(study.done,1);assert.equal(study.queue.length,0);
 }
});
