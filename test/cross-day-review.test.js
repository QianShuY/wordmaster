'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{once}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-cross-day-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'review.db');process.env.TZ='Asia/Shanghai';
const NativeDate=Date;let instant=new NativeDate('2026-10-13T23:58:00+08:00').getTime();
const setTime=value=>{instant=new NativeDate(value).getTime();};
global.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return instant;}};
const {app,db}=require('../app/main');
// Replace clocks only in this isolated test connection. Production SQL and API
// paths remain identical; a separate SQLite connection evaluates modifiers.
const sqlClock=new DatabaseSync(':memory:');
for(const name of ['date','datetime'])db.function(name,{varargs:true},(...args)=>{
 // The fixture uses fixed +08:00 timestamps. Windows SQLite may retain the OS
 // timezone even after Node's TZ changes, so make the test clock explicit.
 const values=args.map(v=>v==='now'?new NativeDate(instant).toISOString():v==='localtime'?'+8 hours':v);
 return sqlClock.prepare(`SELECT ${name}(${values.map(()=>'?').join(',')}) value`).get(...values).value;
});
test('cross-day due reviews, reinforcement, retry identity and capped intervals through real APIs',async t=>{
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(async()=>{server.close();await once(server,'close');db.close();sqlClock.close();global.Date=NativeDate;fs.rmSync(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${server.address().port}`;let sequence=0;
 db.exec("INSERT INTO wordbooks(id,name,daily_new,plan_mode) VALUES(1,'隔离跨日验收',1,'daily')");
 function fixture(id,word='bridge',level=1){db.prepare("INSERT INTO words(id,book_id,word,meaning,pos) VALUES(?,1,?,'桥梁','n.')").run(id,word+String.fromCharCode(96+id));db.prepare("INSERT INTO progress(word_id,correct,wrong,streak,first_studied,next_due,review_level) VALUES(?,2,0,3,datetime('now','localtime','-3 days'),datetime('now','localtime','-1 minute'),?)").run(id,level);}
 const get=async route=>{const r=await fetch(base+route);assert.equal(r.status,200);return r.json();};
 const post=async(id,mode,correct,cycle,extra={})=>{
  const payload={word_id:id,judgement_mode:mode,correct,is_new:false,outcome:correct?'first_correct':'wrong',review_cycle:cycle,session_id:'cross-day-session-'+sequence,request_id:'cross-day-request-'+(++sequence),...extra};
  const response=await fetch(base+'/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});assert.equal(response.status,200);return {body:await response.json(),payload};
 };
 const progress=id=>db.prepare('SELECT * FROM progress WHERE word_id=?').get(id);
 await t.test('meaning before midnight, spelling tomorrow retains server progress and advances only after both',async()=>{
  fixture(1);const originalDue=progress(1).next_due;
  await post(1,'meaning',true,'before-midnight-1');assert.equal(progress(1).next_due,originalDue);assert.equal(progress(1).review_level,1);
  setTime('2026-10-14T00:02:00+08:00');
  const daily=await get('/api/desktop/books/1/today');assert.ok(daily.review.some(w=>w.id===1));assert.equal(daily.review.find(w=>w.id===1).memory.recall_cycle.meaning.streak,1);
  const campaign=await get('/api/adventure/campaign');assert.equal(campaign.books[0].recallPending,1);assert.equal(campaign.books[0].ready,false);
  const final=await post(1,'spelling',true,'after-midnight-1');assert.equal(final.body.memory.recall_cycle.complete,true);assert.equal(progress(1).review_level,2);assert.equal(progress(1).next_due,'2026-10-16 00:02:00');
  assert.ok(!(await get('/api/desktop/books/1/today')).review.some(w=>w.id===1));
  const duplicate=await post(1,'spelling',true,'after-midnight-1',final.payload);assert.equal(duplicate.body.duplicate,true);assert.equal(progress(1).next_due,'2026-10-16 00:02:00');
 });
 await t.test('every later due date returns consolidated words; intervals reach and remain at thirty days',async()=>{
  const days=[4,7,15,30,30];
  for(let i=0;i<days.length;i++){
   const due=progress(1).next_due;setTime(due.replace(' ','T')+'+08:00');
   assert.ok((await get('/api/desktop/books/1/today')).review.some(w=>w.id===1));
   await post(1,'meaning',true,'later-cycle-'+i);assert.equal(progress(1).next_due,due);
   const result=await post(1,'spelling',true,'later-cycle-'+i);
   assert.equal(result.body.memory.review_level,Math.min(3+i,6));
   assert.equal((new NativeDate(progress(1).next_due.replace(' ','T')+'+08:00').getTime()-instant)/86400000,days[i]);
  }
 });
 await t.test('early correct practice preserves scheduled date and review level',async()=>{
  const before=progress(1);await post(1,'meaning',true,'early-practice-1');await post(1,'spelling',true,'early-practice-1');
  assert.equal(progress(1).next_due,before.next_due);assert.equal(progress(1).review_level,before.review_level);
 });
 await t.test('repeated failures survive midnight and new session IDs; two independent correct recalls are required',async()=>{
  setTime('2026-10-20T23:59:00+08:00');fixture(2,'forest',4);
  await post(2,'meaning',false,'failed-before-midnight');await post(2,'meaning',false,'failed-before-midnight');
  assert.equal(progress(2).review_level,0);assert.equal(progress(2).next_due,'2026-10-21 00:09:00');
  setTime('2026-10-21T00:10:00+08:00');
  const first=await post(2,'meaning',true,'resumed-after-midnight');assert.equal(first.body.memory.recall_cycle.meaning.errors,2);assert.equal(first.body.memory.recall_cycle.complete,false);
  await post(2,'spelling',true,'resumed-after-midnight');assert.equal(progress(2).review_level,0);
  await post(2,'meaning',true,'resumed-after-midnight');assert.equal(progress(2).review_level,1);assert.equal(progress(2).next_due,'2026-10-22 00:10:00');
 });
 await t.test('forgetting after a completed cycle reopens reinforcement even when the same cycle ID is reused',async()=>{
  fixture(3,'river');const cycle='completed-then-forgotten';
  await post(3,'meaning',true,cycle);await post(3,'spelling',true,cycle);
  const forgotten=await post(3,'spelling',false,cycle);
  assert.equal(forgotten.body.memory.recall_cycle.complete,false);
  assert.equal(forgotten.body.memory.recall_cycle.spelling.errors,1);
  await post(3,'meaning',true,cycle);await post(3,'spelling',true,cycle);assert.equal(progress(3).review_level,0);
  await post(3,'spelling',true,cycle);assert.equal(progress(3).review_level,1);
 });
 await t.test('overdue by several days returns normally and schedules from actual recall, without skipping levels',async()=>{
  fixture(4,'island',2);setTime('2026-11-03T10:30:00+08:00');
  assert.ok((await get('/api/desktop/books/1/today')).review.some(w=>w.id===4));
  const due=progress(4).next_due;await post(4,'meaning',true,'overdue-many-days');assert.equal(progress(4).next_due,due);
  await post(4,'spelling',true,'overdue-many-days');assert.equal(progress(4).review_level,3);assert.equal(progress(4).next_due,'2026-11-07 10:30:00');
 });
 assert.equal(db.prepare('SELECT COUNT(*) n FROM user_cards').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM adventure_days').get().n,0);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
