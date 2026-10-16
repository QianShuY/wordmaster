'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-ipa-test-'));
process.env.WORDMASTER_DB_PATH=path.join(dir,'isolated.db');
const {db,installBookContent}=require('../app/db'),V=require('../app/vocabulary');
const {reviewedPhonetic}=require('../shared/content-batch');
const {improve,protectedDigest}=require('../scripts/content-quality');
const patches=require('../app/seed/phonetics-batch-20261013.json');
test('all 39 CET6 IPA problems are source and primary-POS bound, without accepting edits or imports',()=>{
 assert.equal(patches.length,39);
 const built=V.buildBook(V.CATALOG.find(x=>x.file==='cet6.txt'));
 assert.equal(built.words.filter(x=>/[әє?]/.test(x.phonetic)).length,0);
 for(const p of patches){
  const original={...p,...p.from};assert.equal(reviewedPhonetic(original),p);
  for(const change of [{phonetic:'user IPA'},{meaning:'个人释义'},{source_raw:'changed'},{source_line:p.source_line+1},{source_file:null},{homograph:1}])assert.equal(reviewedPhonetic({...original,...change}),null);
  assert.equal(built.words.find(w=>w.word===p.word).phonetic,p.to.phonetic);
  assert.equal(new URL(p.source).protocol,'https:');
 }
 // POS-sensitive noun construct keeps its stress; the raw import parser is unchanged.
 const raw=patches.find(x=>x.word==='construct').source_raw;
 assert.ok(/[әє?]/.test(V.parseSourceLine(raw).entry.phonetic));
 assert.equal(reviewedPhonetic({...patches.find(x=>x.word==='construct'),...patches.find(x=>x.word==='construct').from,pos:'n.'}),null);
});
test('IPA maintenance patches original rows once, preserving custom IPA, all learning and plans',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const id=Number(db.prepare("INSERT INTO wordbooks(name,is_builtin) VALUES('六级核心词汇',1)").run().lastInsertRowid);
 installBookContent(id,V.CATALOG.find(x=>x.file==='cet6.txt'));
 for(const p of patches)db.prepare('UPDATE words SET phonetic=? WHERE book_id=? AND word=?').run(p.from.phonetic,id,p.word);
 db.prepare("UPDATE words SET phonetic='my IPA' WHERE book_id=? AND word='yoke'").run(id);
 const w=db.prepare("SELECT id FROM words WHERE book_id=? AND word='construct'").get(id).id;
 db.prepare('INSERT INTO progress(word_id,correct,wrong,review_level,next_due) VALUES(?,4,2,3,?)').run(w,'2026-11-02 08:00:00');
 db.prepare('UPDATE wordbooks SET plan_active=1,daily_new=20,daily_review=30 WHERE id=?').run(id);
 const before=protectedDigest(db),dry=improve(db);assert.equal(dry.results.find(x=>x.book==='六级核心词汇').phonetics_patched,38);
 assert.equal(db.prepare('SELECT phonetic FROM words WHERE id=?').get(w).phonetic,patches.find(x=>x.word==='construct').from.phonetic);
 assert.equal(improve(db,{apply:true}).results.find(x=>x.book==='六级核心词汇').phonetics_patched,38);
 assert.equal(protectedDigest(db),before);assert.equal(db.prepare("SELECT phonetic FROM words WHERE word='yoke'").get().phonetic,'my IPA');
 assert.equal(improve(db,{apply:true}).results.find(x=>x.book==='六级核心词汇').phonetics_patched,0);
});
