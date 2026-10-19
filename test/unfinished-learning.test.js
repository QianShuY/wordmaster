'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-unfinished-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {app,db}=require('../app/main');
test('yesterday unfinished spelling is restored before new words even when its due date is tomorrow',async t=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base='http://127.0.0.1:'+server.address().port,get=async url=>{const r=await fetch(base+url);assert.equal(r.status,200);return r.json();};
 db.exec("INSERT INTO wordbooks(id,name,daily_new) VALUES(1,'first',10),(2,'other',10)");
 const insert=db.prepare('INSERT INTO words(id,book_id,word,meaning,pos) VALUES(?,?,?,?,?)');
 for(const [id,book,word] of [[1,1,'bridge'],[2,1,'forest'],[3,1,'lantern'],[4,2,'river'],[5,1,'castle']])insert.run(id,book,word,'释义'+id,'n.');
 db.exec(`INSERT INTO progress(word_id,correct,wrong,first_studied,next_due) VALUES
 (1,1,0,datetime('now','localtime','-1 day'),datetime('now','localtime','+1 day')),
 (2,0,0,datetime('now','localtime','-1 day'),datetime('now','localtime')),
 (3,2,0,datetime('now','localtime','-1 day'),datetime('now','localtime','+1 day')),
 (4,1,0,datetime('now','localtime','-1 day'),datetime('now','localtime','+1 day'));
 INSERT INTO review_log(word_id,correct,practice_mode) VALUES(1,1,'meaning'),(3,1,'meaning'),(3,1,'spelling'),(4,1,'meaning');`);
 const before=JSON.stringify(db.prepare('SELECT * FROM progress ORDER BY word_id').all());
 const today=await get('/api/desktop/books/1/today');
 assert.equal(today.unfinished_total,2);assert.deepEqual(today.review.map(w=>w.id),[2,1]);assert.deepEqual(today.learn.map(w=>w.id),[5]);assert.equal(today.review_has_more,false);
 const books=await get('/api/books');assert.equal(books.find(b=>b.id===1).unfinished_count,2);
 const learned=await get('/api/desktop/books/1/words?status=learned');assert.equal(learned.total,3);assert.ok(learned.items.every(w=>w.first_studied));
 const yesterday=await get('/api/desktop/books/1/words?status=yesterday');assert.equal(yesterday.total,3);
 const unfinished=await get('/api/desktop/books/1/words?status=unfinished');assert.equal(unfinished.total,2);assert.ok(unfinished.items.every(w=>[1,2].includes(w.id)));
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM progress ORDER BY word_id').all()),before,'viewing and recovery do not write answers');
 let request=0;const post=async(mode,correct)=>{
  const r=await fetch(base+'/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word_id:1,correct,is_new:false,request_id:'unfinished-request-'+(++request),session_id:'unfinished-session',outcome:correct?'first_correct':'wrong',judgement_mode:mode,review_cycle:'unfinished-cycle'})});assert.equal(r.status,200);return r.json();
 };
 await post('meaning',true);await post('spelling',false);await post('spelling',true);
 assert.ok((await get('/api/desktop/books/1/words?status=unfinished')).items.some(w=>w.id===1),'one correct spelling after an error is not enough');
 await post('spelling',true);assert.ok(!(await get('/api/desktop/books/1/words?status=unfinished')).items.some(w=>w.id===1));
});
test.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
