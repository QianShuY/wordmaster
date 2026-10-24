'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-ending-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {app,db}=require('../app/main');
const {createChapterEnding}=require('../app/chapter-ending'),Battle=require('../shared/boss-battle');
const pool=Array.from({length:12},(_,i)=>({id:i+1,answer:'word'+String.fromCharCode(97+i),meaning:'词义'+i,pos:'n.',choices:['词义'+i,'甲','乙','丙']}));
function victory(session){const game=Battle.create(session.pool,session.initial.instanceId,session.initial),events=[];
 const act=(action,...args)=>{events.push({action,args});assert.ok(game[action](...args));};
 act('teach',Battle.DECLARATION);act('start');
 while(game.state.phase!=='won'){
  if(game.state.phase==='feedback'){act('next');continue;}
  if(game.state.phase==='stormIntro'){act('elapseDomain',Math.min(1000,game.state.domain.introMs));continue;}
  if(game.state.phase==='fallen'){act('revive',Battle.DECLARATION);continue;}
  if(game.state.phase==='choose')act('choose',game.state.hp<50&&game.state.heals?'heal':'attack');
  if(game.state.phase==='stormIntro')continue;
  const q=game.question;act('answer',q.mode==='meaning'?q.meaning:q.answer,false);
 }
 return events;
}
test('server replays fixed battle; rejected transcripts never grant endings; first clear and retries are idempotent and preserve learning',()=>{
 let available=false;const service=createChapterEnding(db,{state:()=>({bossAvailable:available})},()=>pool,()=> 'isolated-db');
 assert.throws(()=>service.start(),/尚未抵达/);assert.equal(service.ending(),null);available=true;
 const session=service.start(),events=victory(session),before=JSON.stringify(db.prepare('SELECT * FROM progress').all());
 assert.throws(()=>service.finish(session.id,[{action:'won',args:[]},{action:'start',args:[]},{action:'next',args:[]}]),/无效/);
 assert.throws(()=>service.finish(session.id,events.slice(0,3)),/尚未/);assert.equal(service.ending(),null);
 const forged=structuredClone(events);forged[2]={action:'answer',args:['fake',false]};assert.throws(()=>service.finish(session.id,forged),/顺序/);
 const first=service.finish(session.id,events);assert.equal(first.firstClear,true);assert.equal(first.ending.memorial,'渡雾者之印');
 assert.equal(service.finish(session.id,events).duplicate,true);assert.throws(()=>service.finish(session.id,[...events,{action:'next',args:[]}]),/不可更换/);
 const second=service.start();assert.equal(service.finish(second.id,victory(second)).firstClear,false);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM adventure_endings').get().n,1);
 assert.equal(service.ending().completedAt,first.ending.completedAt);assert.deepEqual(service.ending().summary,first.ending.summary);
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM progress').all()),before);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM review_log').get().n,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM user_cards').get().n,0);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('domain transcript rejects forged clocks and premature answers; legacy sessions can still finish',()=>{
 const service=createChapterEnding(db,{state:()=>({bossAvailable:true})},()=>pool,()=> 'isolated-db');
 const session=service.start(),events=victory(session),at=events.findIndex(e=>e.action==='elapseDomain');assert.ok(at>0);
 for(const ms of [-1,0,1001,0.5,'1000']){const bad=structuredClone(events);bad[at].args=[ms];assert.throws(()=>service.finish(session.id,bad),/无效/);}
 const skipped=events.filter(e=>e.action!=='elapseDomain');assert.throws(()=>service.finish(session.id,skipped),/顺序/);
 const old=service.start();old.initial={...old.initial,version:1,bossHp:120};delete old.initial.domain;db.prepare('UPDATE boss_sessions SET initial_json=? WHERE id=?').run(JSON.stringify(old.initial),old.id);
 assert.equal(service.finish(old.id,victory(old)).ok,true);
 assert.equal(service.finish(session.id,events).ok,true);
});
test('ending API withholds story until clear, route gates sessions, formal first clear appears as 14/14',async t=>{
 db.exec('DELETE FROM adventure_endings; DELETE FROM boss_sessions');
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const get=async path=>(await fetch(base+path)).json();
 assert.equal((await get('/api/adventure/ending')).ending,null);
 assert.equal((await fetch(base+'/api/adventure/boss/sessions',{method:'POST'})).status,409);
 assert.equal((await fetch(base+'/api/adventure/boss/sessions/missing')).status,404);
 // Build a true route in this isolated database; the test service supplies only the frozen battle pool.
 const put=db.prepare("INSERT INTO adventure_days(day,stage_no,book_id,book_name) VALUES(date('now','localtime',?),?,1,'fixture')");for(let i=1;i<=13;i++)put.run(`-${14-i} days`,i);
 const service=createChapterEnding(db,{state:()=>({bossAvailable:true})},()=>pool,()=> 'isolated-db'),session=service.start();
 const response=await fetch(base+'/api/adventure/boss/sessions/'+session.id+'/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:victory(session)})});
 assert.equal(response.status,200);assert.equal((await get('/api/adventure/campaign')).completed,14);assert.equal((await get('/api/adventure/campaign')).chapterCleared,true);assert.equal((await get('/api/adventure/ending')).ending.paragraphs.length,4);
});
test.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
