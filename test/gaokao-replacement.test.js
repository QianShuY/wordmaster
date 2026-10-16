'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-gaokao-replace-test-'));
process.env.WORDMASTER_DB_PATH=path.join(dir,'fixture.db');
const {db,installBookContent}=require('../app/db');
const V=require('../app/vocabulary');
const {preview,rehearse,fingerprint}=require('../scripts/preview-gaokao-replacement');
const batch=require('../docs/vocabulary-audit/gaokao-selected-reviewed-20261013.json');

test('Gaokao replacement inventory and rollback rehearsal preserve user history and independently create new content',async t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const old=Number(db.prepare("INSERT INTO wordbooks(name,is_builtin) VALUES('中考核心词汇',1)").run().lastInsertRowid);
 installBookContent(old,V.CATALOG.find(x=>x.file==='zhongkao.txt'));
 const custom=Number(db.prepare("INSERT INTO wordbooks(name,is_builtin) VALUES('我的词库',0)").run().lastInsertRowid);
 db.prepare("INSERT INTO words(book_id,word,meaning) VALUES(?,'café','我的咖啡馆')").run(custom);
 const word=db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id LIMIT 1').get(old);
 const initial=fingerprint(db);
 await t.test('clean old library can be removed only inside an always-rolled-back subset rehearsal',()=>{
  const plan=preview(db);assert.equal(plan.old_book_action,'remove-unreferenced-built-in');assert.equal(plan.replacement_ready,false);
  const result=rehearse(db,batch);assert.equal(result.subset_words,53);assert.notEqual(result.new_book_id,old);
  assert.equal(result.new_progress_rows,0);assert.equal(result.new_plan_active,0);assert.equal(result.old_book_remaining,false);
  assert.equal(result.all_existing_rows_restored,true);assert.equal(fingerprint(db),initial);
 });
 await t.test('active plan and edited content each force history preservation',()=>{
  db.prepare('UPDATE wordbooks SET plan_active=1,daily_new=23 WHERE id=?').run(old);
  assert.ok(preview(db).history_reasons.includes('active-plan'));
  assert.equal(rehearse(db,batch,{afterTransition(copy,id){
    const history=copy.prepare('SELECT * FROM book_history WHERE book_id=?').get(old);
    assert.equal(history.replacement_book_id,id);assert.equal(JSON.parse(history.original_plan_json).daily_new,23);
    assert.equal(copy.prepare('SELECT COUNT(*) n FROM word_answer_policies').get().n,53);
  }}).old_book_remaining,true);
  db.prepare('UPDATE wordbooks SET plan_active=0 WHERE id=?').run(old);
  db.prepare("UPDATE words SET example='My personal example.' WHERE id=?").run(word.id);
  assert.deepEqual(preview(db).edited_word_ids,[word.id]);assert.equal(rehearse(db,batch).old_book_remaining,true);
  db.prepare('UPDATE words SET example=? WHERE id=?').run(word.example,word.id);
 });
 await t.test('non-FK logs, unfinished recall and future FK references are discovered and retained',()=>{
  db.prepare('INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,3,2,?)').run(word.id,'2026-11-01 08:00:00');
  db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,0)').run(word.id);
  db.prepare("INSERT INTO recall_cycles(word_id,cycle_id,state_json) VALUES(?,'keep-cycle','{}')").run(word.id);
  db.exec('CREATE TABLE future_notes(id INTEGER PRIMARY KEY, vocabulary_entry INTEGER REFERENCES words(id), note TEXT)');
  db.prepare("INSERT INTO future_notes(vocabulary_entry,note) VALUES(?,'user note')").run(word.id);
  const plan=preview(db);for(const name of ['progress','review_log','recall_cycles','future_notes'])assert.ok(plan.references.some(x=>x.table===name));
  const before=fingerprint(db);assert.equal(rehearse(db,batch).old_book_remaining,true);assert.equal(fingerprint(db),before);
 });
 await t.test('failed insert or reference integrity failure rolls back new content and all old rows',()=>{
  const before=fingerprint(db);
  assert.throws(()=>rehearse(db,batch,{afterInsert(){throw new Error('simulated interruption');}}),/simulated interruption/);
  assert.equal(fingerprint(db),before);
  const duplicate=structuredClone(batch);duplicate.entries[1].headword=duplicate.entries[0].headword;
  duplicate.entries[1].accepted_spellings=duplicate.entries[0].accepted_spellings;
  duplicate.entries[1].answer_policy=duplicate.entries[0].answer_policy;
  assert.throws(()=>rehearse(db,duplicate),/UNIQUE constraint/);assert.equal(fingerprint(db),before);
  const bad=structuredClone(batch);bad.entries[0].answer_policy.accepted.push('wrong');
  assert.throws(()=>rehearse(db,bad),/policy differs/);assert.equal(fingerprint(db),before);
 });
 await t.test('frozen battle JSON forces conservative preservation even without direct old-book foreign keys',()=>{
  db.prepare("INSERT INTO boss_sessions(id,chapter,pool_json,initial_json) VALUES('saved-battle',1,?,?)").run(JSON.stringify([{id:word.id}]),'{}');
  assert.ok(preview(db).references.some(x=>x.table==='boss_sessions'));
  assert.equal(rehearse(db,batch).old_book_remaining,true);
 });
});
