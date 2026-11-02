'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const express=require('express');
 const {create,install}=require('../app/english-training');
function database(){
 const db=new DatabaseSync(':memory:');db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE wordbooks(id INTEGER PRIMARY KEY,name TEXT,description TEXT,is_builtin INTEGER DEFAULT 0);
 CREATE TABLE words(id INTEGER PRIMARY KEY,book_id INTEGER REFERENCES wordbooks(id) ON DELETE CASCADE,word TEXT,headword TEXT,meaning TEXT,phonetic TEXT,pos TEXT,example TEXT,source_file TEXT,source_raw TEXT,UNIQUE(book_id,word));
 CREATE TABLE book_history(book_id INTEGER PRIMARY KEY);
 CREATE TABLE progress(word_id INTEGER PRIMARY KEY,streak INTEGER,next_due TEXT);
 INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,'六级',1);
 INSERT INTO words(id,book_id,word,meaning) VALUES(1,1,'bridge','桥');
 INSERT INTO progress VALUES(1,3,'2099-01-01');`);return db;
}
const entry=(word='Bridge',examId='cet6-2024-06')=>({word,translation:'桥梁',phonetic:'brɪdʒ',pos:'n.',source:{examId,examTitle:'六级试卷',sectionType:'reading',sentence:'A bridge connects the towns.'}});
test('collecting training vocabulary is idempotent, keeps sources and never claims study progress',()=>{
 const db=database();try{
  const schemaBefore=db.prepare('SELECT name FROM sqlite_master ORDER BY name').all();
  const store=create(db);assert.equal(store.summary(),null);
  assert.deepEqual(db.prepare('SELECT name FROM sqlite_master ORDER BY name').all(),schemaBefore,'read-only startup must not create training metadata');
  const result=store.collect([entry()]);assert.equal(result.added,1);assert.equal(result.book.name,'训练生词');assert.notEqual(result.book.id,1);
  assert.equal(store.collect([entry(' bridge '),entry('BRIDGE','cet4-other')]).added,0);
  assert.equal(store.summary().count,1);
  assert.equal(db.prepare('SELECT count(*) n FROM desktop_training_sources').get().n,2);
  assert.equal(db.prepare('SELECT count(*) n FROM progress').get().n,1);
  assert.deepEqual({...db.prepare('SELECT * FROM progress WHERE word_id=1').get()},{word_id:1,streak:3,next_due:'2099-01-01'});
  const w=db.prepare('SELECT * FROM words WHERE book_id=?').get(result.book.id);
  assert.equal(w.word,'bridge');assert.equal(w.example,'A bridge connects the towns.');
  db.prepare('UPDATE words SET meaning=? WHERE id=?').run('手工修订',w.id);
  store.collect([entry()]);assert.equal(db.prepare('SELECT meaning FROM words WHERE id=?').get(w.id).meaning,'手工修订');
 }finally{db.close();}
});
test('invalid batches write nothing; renamed and deleted training books are handled safely',()=>{
 const db=database();try{
  const store=create(db);
  assert.throws(()=>store.collect([entry(),{word:'bad',translation:''}]),/释义/);
  assert.equal(store.summary(),null);assert.equal(db.prepare('SELECT count(*) n FROM words').get().n,1);
  assert.throws(()=>store.collect([entry('../bad')]),/单词/);
  assert.throws(()=>store.collect(Array.from({length:201},()=>entry())),/200/);
  const first=store.collect([entry()]);db.prepare('UPDATE wordbooks SET name=? WHERE id=?').run('我的训练词',first.book.id);
  assert.equal(store.collect([entry('travel')]).book.name,'我的训练词');
  db.prepare('DELETE FROM wordbooks WHERE id=?').run(first.book.id);
  assert.equal(store.collect([entry('journey')]).book.count,1);
  assert.equal(db.prepare('SELECT meaning FROM words WHERE id=1').get().meaning,'桥');
 }finally{db.close();}
});
test('database write errors roll back the whole vocabulary batch',()=>{
 const db=database();try{
  const store=create(db);db.exec("CREATE TRIGGER fail_collection BEFORE INSERT ON words WHEN NEW.word='stop' BEGIN SELECT RAISE(ABORT,'test failure'); END");
  assert.throws(()=>store.collect([entry(),entry('stop')]),/test failure/);
  assert.equal(store.summary(),null);assert.equal(db.prepare('SELECT count(*) n FROM words').get().n,1);
 }finally{db.close();}
});
test('subpath mount preserves assets/range requests and rejects cross-origin vocabulary writes',async t=>{
 const db=database(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-practice-test-'));
 fs.writeFileSync(path.join(dir,'index.html'),'<h1>English training</h1>');fs.writeFileSync(path.join(dir,'audio.mp3'),'0123456789');
 const app=express();app.use(express.json());install(app,db,{directory:dir});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const origin=`http://127.0.0.1:${server.address().port}`;
 const redirect=await fetch(origin+'/practice',{redirect:'manual'});assert.equal(redirect.headers.get('location'),'/practice/');
 assert.match(await (await fetch(origin+'/practice/')).text(),/English training/);
 const audio=await fetch(origin+'/practice/audio.mp3',{headers:{Range:'bytes=2-5'}});assert.equal(audio.status,206);assert.equal(await audio.text(),'2345');
 assert.equal((await fetch(origin+'/practice/missing.mp3')).status,404);
 const dictionary=await (await fetch(origin+'/api/desktop/training/dictionary?word=BRIDGE')).json();
 assert.equal(dictionary.entry.word,'bridge');assert.equal(dictionary.entry.translation,'桥');
 assert.equal((await (await fetch(origin+'/api/desktop/training/dictionary?word=unknown')).json()).entry,null);
 const post=source=>fetch(origin+'/api/desktop/training/vocabulary',{method:'POST',headers:{Origin:source,'Content-Type':'application/json'},body:JSON.stringify({entries:[entry()]})});
 assert.equal((await post('https://other.example')).status,403);assert.equal((await post(origin)).status,200);
 const status=await (await fetch(origin+'/api/desktop/training')).json();assert.equal(status.available,true);assert.equal(status.vocabulary.count,1);
});
