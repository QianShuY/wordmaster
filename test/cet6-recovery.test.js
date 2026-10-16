'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-recovery-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {db,installBookContent}=require('../app/db'),V=require('../app/vocabulary'),D=require('../shared/domain');
const {recover,snapshot}=require('../scripts/recover-cet6');
const fixes=require('../app/seed/cet6-recovered.json');
test('reviewed recovery reconciles every source row and separates resume senses',()=>{
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt'));
 assert.equal(built.report.accepted,2272);assert.equal(built.report.excluded,0);assert.equal(built.report.duplicates,1);
 assert.equal(built.report.nonempty,built.report.accepted+built.report.duplicates);
 assert.equal(built.words.filter(w=>w.word==='unity').length,1);
 const verb=built.words.find(w=>w.word==='resume 1'),noun=built.words.find(w=>w.word==='resume 2');
 assert.equal(verb.pos,'v.');assert.equal(noun.pos,'n.');assert.notEqual(verb.phonetic,noun.phonetic);
 for(const w of [verb,noun,built.words.find(w=>w.word==='boom 2')]){
  const presented={...w,...D.sampleWordPresentation(w,{is_builtin:1})};
  assert.equal(D.judgeAnswer('spelling',w.headword,presented),true);
  assert.equal(presented.answer_word,w.headword,'spelling prompt uses the headword without its internal sense number');
  assert.ok(w.reviewed_example.text&&w.reviewed_example.translation);
 }
 assert.equal(V.parseSourceLine(fixes[0].source_raw).status,'excluded','source recovery must not relax the general parser');
});
test('recovery inserts only missing reviewed rows, retains all existing data and is idempotent',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const spec=V.CATALOG.find(s=>s.file==='cet6.txt');
 db.exec('BEGIN');db.prepare('INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,?,1)').run(spec.name);installBookContent(1,spec);db.exec('COMMIT');
 // Simulate the legacy exclusion, with a manual conflicting word already present.
 for(const word of V.buildBook(spec).words.filter(w=>fixes.some(f=>f.source_raw===w.source_raw)))db.prepare('DELETE FROM words WHERE book_id=1 AND word=?').run(word.word);
 db.exec("INSERT INTO words(book_id,word,pos,meaning) VALUES(1,'arrogant','adj.','我自己编辑的释义'); UPDATE wordbooks SET plan_active=1,daily_new=15 WHERE id=1;");
 const id=db.prepare("SELECT id FROM words WHERE word='define'").get().id;
 db.prepare("INSERT INTO progress(word_id,correct,next_due) VALUES(?,3,'2026-10-20 12:00:00')").run(id);
 const ids=db.prepare('SELECT id FROM words ORDER BY id').all().map(w=>w.id),before=snapshot(db,ids,1);
 const dry=recover(db);assert.equal(dry.added.length,12);assert.equal(snapshot(db,ids,1),before);
 assert.equal(db.prepare("SELECT id FROM words WHERE word='resume 1'").get(),undefined);
 const applied=recover(db,{apply:true});assert.equal(applied.added.length,12);assert.equal(snapshot(db,ids,1),before);
 assert.equal(db.prepare("SELECT meaning FROM words WHERE word='arrogant'").get().meaning,'我自己编辑的释义');
 assert.equal(recover(db,{apply:true}).added.length,0);
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 db.exec("UPDATE vocabulary_builds SET source_sha256='other-source'");assert.throws(()=>recover(db,{apply:true}),/Source hash differs/);
});
