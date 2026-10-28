'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-balanced-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {app,db}=require('../app/main'),{distribute}=require('../app/daily-workload');
test('backlog is shared around future peaks, without replacing those dates',()=>{
 assert.deepEqual(distribute(78,[0,0,0]),[26,26,26]);assert.deepEqual(distribute(78,[0,30,0]),[36,6,36]);assert.deepEqual(distribute(52,[0,0],2),[26,26]);assert.deepEqual(distribute(26,[0],1),[26]);
});
test('78 due words become a stable 26-word daily goal, ten at a time; real recalls, recovery and campaign claims remain authoritative',async t=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base='http://127.0.0.1:'+server.address().port,get=async url=>{const r=await fetch(base+url);assert.equal(r.status,200);return r.json();};
 const post=async(url,body)=>{const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 db.exec("INSERT INTO wordbooks(id,name,daily_new,plan_mode) VALUES(1,'均衡样本',20,'daily'),(2,'隔离词库',20,'daily')");
 const insert=db.prepare('INSERT INTO words(id,book_id,word,meaning,pos) VALUES(?,?,?,?,?)');
 for(let i=1;i<=101;i++)insert.run(i,i===101?2:1,'word'+String.fromCharCode(97+Math.floor(i/26))+String.fromCharCode(97+i%26),'词义'+i,'n.');
 const progress=db.prepare("INSERT INTO progress(word_id,correct,wrong,streak,first_studied,last_review,next_due,review_level) VALUES(?,1,?,1,datetime('now','localtime','-7 days'),datetime('now','localtime','-3 days'),datetime('now','localtime',?),1)");
 for(let i=1;i<=78;i++)progress.run(i,i===1?5:0,'-1 hour');progress.run(79,0,'+4 days');progress.run(80,0,'+5 days');progress.run(101,0,'-1 hour');
 // The two future dates are excluded from today's manifest.
 const before=JSON.stringify(db.prepare('SELECT * FROM progress ORDER BY word_id').all());
 const preview=(await get('/api/books')).find(b=>b.id===1).workload;
 assert.equal(preview.review_target,26);assert.equal(preview.frozen,false);assert.equal(preview.new_target,10);assert.equal(db.prepare('SELECT COUNT(*) n FROM desktop_daily_workload').get().n,0);
 const mapPreview=(await get('/api/adventure/campaign')).books.find(b=>b.id===1);
 assert.equal(mapPreview.todayPlan.review,preview.review_remaining);assert.equal(mapPreview.todayPlan.newTarget,preview.new_target);assert.equal(mapPreview.todayPlan.frozen,false);assert.equal(mapPreview.ready,false);
 assert.equal((await post('/api/adventure/campaign/complete-day',{book_id:1})).status,409);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM desktop_daily_workload').get().n,0,'map preview and a rejected claim never freeze a daily plan');
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM progress ORDER BY word_id').all()),before);
 let payload=await get('/api/desktop/books/1/today');const manifest=payload.workload.review_ids;
 assert.equal(manifest.length,26);assert.ok(manifest.includes(1));assert.equal(payload.review.length,10);assert.equal(payload.review_has_more,true);assert.equal(payload.workload.deferred_total,52);
 assert.ok(manifest.every(id=>id<79));assert.equal(JSON.stringify(db.prepare('SELECT * FROM progress ORDER BY word_id').all()),before);
 assert.deepEqual((await get('/api/desktop/books/1/today')).workload.review_ids,manifest);
 assert.equal((await post('/api/adventure/campaign/complete-day',{book_id:1})).status,409);
 let request=0;
 async function answer(id,mode){const r=await post('/api/progress',{word_id:id,correct:true,is_new:false,request_id:'balanced-request-'+(++request),session_id:'balanced-session',outcome:'first_correct',judgement_mode:mode,review_cycle:'balanced-cycle'});assert.equal(r.status,200);}
 const first=payload.review[0].id;await answer(first,'meaning');payload=await get('/api/desktop/books/1/today');assert.equal(payload.workload.review_remaining,26,'meaning alone never completes a spellable review');await answer(first,'spelling');
 payload=await get('/api/desktop/books/1/today');assert.equal(payload.workload.review_target,26);assert.equal(payload.workload.review_remaining,25);assert.ok(!payload.review.some(w=>w.id===first));
 for(const id of manifest.filter(id=>id!==first)){await answer(id,'meaning');await answer(id,'spelling');}
 payload=await get('/api/desktop/books/1/today');assert.equal(payload.review.length,0);assert.equal(payload.review_has_more,false);assert.equal(payload.workload.deferred_total,52);assert.equal(payload.learn.length,10);
 const fresh=payload.learn.map(w=>w.id);for(const id of fresh){assert.equal((await post('/api/learn',{word_id:id})).status,200);}
 const recovery=await get('/api/desktop/books/1/today');assert.equal(recovery.review.length,10,'lost checkpoints can recover new-word consolidation');assert.equal(recovery.workload.new_pending,10);assert.ok(recovery.review.every(w=>fresh.includes(w.id)));
 for(const id of fresh){await answer(id,'meaning');await answer(id,'spelling');}
 assert.equal((await post('/api/adventure/campaign/complete-day',{book_id:1})).status,200,'only the real balanced daily goal is required, not the deferred backlog');
 const remaining=db.prepare("SELECT COUNT(*) n FROM progress WHERE word_id BETWEEN 1 AND 78 AND next_due<=datetime('now','localtime')").get().n;assert.equal(remaining,52);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM recall_cycles WHERE json_extract(state_json,\'$.complete\')=1').get().n,36);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});
test.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});

test('an unfinished backlog keeps its prior catch-up deadline instead of restarting a three-day deferral forever',()=>{
 db.exec("INSERT INTO wordbooks(id,name,daily_new,plan_mode) VALUES(3,'跨日样本',20,'daily')");
 const insert=db.prepare('INSERT INTO words(id,book_id,word,meaning) VALUES(?,3,?,?)'),ids=[];
 for(let i=200;i<252;i++){ids.push(i);insert.run(i,'carry'+String.fromCharCode(97+i%26)+String.fromCharCode(97+Math.floor(i/26)),'待复习');db.prepare("INSERT INTO progress(word_id,correct,next_due,first_studied) VALUES(?,1,datetime('now','localtime','-1 day'),datetime('now','localtime','-7 days'))").run(i);}
 db.prepare("INSERT INTO desktop_daily_workload(day,book_id,review_ids_json,new_target,catchup_until,forecast_json,deferred_ids_json,initial_new_ids_json) VALUES(date('now','localtime','-1 day'),3,'[]',0,date('now','localtime','+1 day'),'[]',?,'[]')").run(JSON.stringify(ids));
 const service=require('../app/daily-workload').createDailyWorkload(db),book=db.prepare('SELECT * FROM wordbooks WHERE id=3').get();
 const workload=service.get(book,{daily_quota:20,remaining_new:0});assert.equal(workload.review_target,26,'52 remaining words are spread over the two days left, not three new days');assert.equal(workload.deferred_total,26);
});
