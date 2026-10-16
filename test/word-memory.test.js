'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
const {createWordMemory}=require('../app/word-memory');
test('batched diagnostics preserve error ranking, legacy totals and unfinished cycles across chunks',()=>{
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE progress(word_id INTEGER PRIMARY KEY,streak INTEGER,first_studied TEXT,next_due TEXT,review_level INTEGER,wrong INTEGER,correct INTEGER);
 CREATE TABLE review_log(word_id INTEGER,correct INTEGER,practice_mode TEXT);
 CREATE TABLE recall_cycles(word_id INTEGER PRIMARY KEY,state_json TEXT);`);
 const add=db.prepare("INSERT INTO progress VALUES(?,1,'2026-10-11','2026-10-14',2,?,3)");for(let i=1;i<=401;i++)add.run(i,i%5);
 const log=db.prepare('INSERT INTO review_log VALUES(?,?,?)');
 for(const id of [1,200,201,400,401]){for(const mode of [null,'learn','spelling','meaning','spelling','meaning'])log.run(id,0,mode);log.run(id,1,'pos');}
 const cycle={complete:false,meaning:{streak:1},spelling:{streak:0}};db.prepare('INSERT INTO recall_cycles VALUES(201,?)').run(JSON.stringify(cycle));
 let queries=0;const reader=createWordMemory({prepare(sql){queries++;return db.prepare(sql);}});
 const ids=Array.from({length:402},(_,i)=>i+1),result=reader.read([...ids,1,201]);
 assert.equal(result.size,401);assert.equal(queries,9,'three bounded queries per 200 distinct IDs, never per word');
 for(const id of ids){const p=db.prepare('SELECT streak,first_studied,next_due,review_level,wrong,correct FROM progress WHERE word_id=?').get(id);if(!p){assert.equal(result.has(id),false);continue;}
  const errors=db.prepare('SELECT practice_mode,COUNT(*) n FROM review_log WHERE word_id=? AND correct=0 GROUP BY practice_mode ORDER BY n DESC,practice_mode').all(id),weak=errors.find(r=>['spelling','meaning','pos'].includes(r.practice_mode));
  assert.deepEqual(result.get(id),{...p,recall_cycle:id===201?cycle:null,errors_total:Math.max(p.wrong,errors.reduce((n,r)=>n+r.n,0)),weak_mode:weak?.practice_mode||null,weak_errors:weak?.n||0});
 }
 assert.equal(reader.one(999),null);assert.equal(reader.read([]).size,0);db.close();
});
