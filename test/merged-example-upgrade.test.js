'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-merged-content-')),file=path.join(dir,'fixture.db');process.env.WORDMASTER_DB_PATH=file;
const {db,seed}=require('../app/db'),V=require('../app/vocabulary'),{upgradeContent}=require('../app/content-upgrade'),{protectedDigest}=require('../app/content-maintenance'),{runtimeInfo}=require('../app/runtime-info');
test('merged publication fills old blank NPEE/TEM examples and upgrades prior Gaokao stamps without changing learning or user text',async t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});seed();
 const books=db.prepare('SELECT * FROM wordbooks ORDER BY id').all();assert.equal(books.length,5);
 for(const b of books){
  const totals=db.prepare("SELECT COUNT(*) n,SUM(trim(example)<>'' AND trim(example_translation)<>'') pairs FROM words WHERE book_id=?").get(b.id);
  assert.equal(totals.pairs,totals.n,b.name);
 }
 assert.equal(db.prepare('SELECT COUNT(*) n FROM words').get().n,27666);
 assert.notEqual(V.VERSION,'2026-10-28.2');
 const gaokao=books.find(b=>b.name===V.GAOKAO.name),originalGaokao=JSON.stringify(db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(gaokao.id));
 const patched=[];
 for(const file of ['npee.txt','tem.txt']){
  const words=db.prepare('SELECT * FROM words WHERE source_file=? ORDER BY id LIMIT 2').all(file);
  patched.push(words[0]);db.prepare("UPDATE words SET example='',example_translation='' WHERE id=?").run(words[0].id);
  db.prepare("UPDATE words SET example='My own example.',example_translation='' WHERE id=?").run(words[1].id);
  db.prepare("INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,4,1,'2026-12-01')").run(words[0].id);
 }
 db.prepare("UPDATE vocabulary_builds SET content_version='2026-10-28.2'").run();
 const digest=protectedDigest(db),before=JSON.stringify(db.prepare("SELECT * FROM words WHERE example='My own example.' ORDER BY id").all());
 const result=await upgradeContent(db,{databasePath:file});assert.equal(result.status,'applied');assert.equal(result.counts.examples,2);assert.equal(result.protected_state_unchanged,true);
 assert.equal(protectedDigest(db),digest);assert.equal(runtimeInfo(db).contentCurrent,true);
 assert.equal(JSON.stringify(db.prepare("SELECT * FROM words WHERE example='My own example.' ORDER BY id").all()),before);
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(gaokao.id)),originalGaokao);
 for(const word of patched)assert.deepEqual(db.prepare('SELECT * FROM words WHERE id=?').get(word.id),word);
 const files=fs.readdirSync(path.join(dir,'backups'));assert.equal((await upgradeContent(db,{databasePath:file})).status,'up-to-date');assert.deepEqual(fs.readdirSync(path.join(dir,'backups')),files);
});
