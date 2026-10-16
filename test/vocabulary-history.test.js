'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{once}=require('node:events');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-history-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {app,db}=require('../app/main'),{contentHash}=require('../app/vocabulary-history'),P=require('../shared/answer-policy');
test('historical books retain readable records while every learning and editing path is blocked; active policies reach API and grading',async t=>{
 db.exec("INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,'旧中考',1),(2,'高考测试夹具',1); INSERT INTO words(id,book_id,word,pos,meaning,headword,source_file) VALUES(1,1,'river','n.','河流','river','zhongkao.txt'),(2,2,'café','n.','咖啡馆','café','gaokao-2025-scope'); INSERT INTO progress(word_id,correct,wrong,streak) VALUES(1,1,2,0); INSERT INTO review_log(word_id,correct) VALUES(1,0); INSERT INTO book_history(book_id,replacement_book_id,reason_json,original_plan_json) VALUES(1,2,'[\"learning-history\"]','{}')");
 const word=db.prepare('SELECT * FROM words WHERE id=2').get();db.prepare('INSERT INTO word_answer_policies VALUES(?,?,?)').run(2,JSON.stringify(P.create('café',['café','cafe'])),contentHash(word));
 const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=(url,method='GET',body)=>fetch(base+url,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 assert.deepEqual((await(await call('/api/books')).json()).map(b=>b.id),[2]);
 assert.equal((await(await call('/api/books/history')).json())[0].read_only,true);
 assert.equal((await(await call('/api/books?include_history=1')).json()).find(b=>b.id===1).read_only,true);
 assert.equal((await(await call('/api/books/1/words')).json())[0].word,'river');
 const before=JSON.stringify(db.prepare('SELECT * FROM progress WHERE word_id=1').get());
 for(const [url,method,body] of [
  ['/api/books/1/study','GET'],['/api/desktop/books/1/today','GET'],['/api/desktop/books/1/choices','GET'],['/api/mistakes/study?book_id=1','GET'],
  ['/api/books/1/plan','PUT',{mode:'daily',daily_new:20}],['/api/books/1/plan','DELETE'],['/api/books/1/import','POST',{text:'cat 猫'}],
  ['/api/words','POST',{book_id:1,word:'cat',meaning:'猫'}],['/api/words/1','PUT',{word:'river',meaning:'修改'}],['/api/words/1','DELETE'],
  ['/api/progress','POST',{word_id:1,correct:true}],['/api/progress','POST',{word_id:1,book_id:2,correct:true}],['/api/words/1','PUT',{book_id:2,word:'river',meaning:'绕过只读'}],['/api/learn','POST',{word_id:1}],['/api/mistakes/1','DELETE'],['/api/adventure/campaign/complete-day','POST',{book_id:1}]
 ])assert.equal((await call(url,method,body)).status,403,url);
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM progress WHERE word_id=1').get()),before);
 assert.equal((await(await call('/api/mistakes')).json()).length,0);
 assert.equal((await(await call('/api/adventure/campaign')).json()).books.some(b=>b.id===1),false);
 assert.equal((await(await call('/api/stats/overview?book_id=1')).json()).today.historical_read_only,true);
 assert.ok((await(await call('/api/books/2/words')).json())[0].answer_policy);
 const payload={word_id:2,correct:true,is_new:true,request_id:'reviewed-request-001',session_id:'reviewed-session-001',outcome:'first_correct',judgement_mode:'spelling',answer_value:'cafe'};
 assert.equal((await call('/api/progress','POST',payload)).status,200);
 assert.equal((await(await call('/api/progress','POST',payload)).json()).duplicate,true);
 assert.equal((await call('/api/progress','POST',{...payload,answer_value:'café'})).status,409);
 assert.equal((await call('/api/progress','POST',{...payload,request_id:'reviewed-request-002',answer_value:'cafeteria'})).status,409);
 db.exec("UPDATE words SET meaning='我的手改释义' WHERE id=2");
 assert.equal((await(await call('/api/books/2/words')).json())[0].answer_policy,undefined);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
});
