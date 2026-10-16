'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(),'moci-all-content-'));
process.env.WORDMASTER_DB_PATH = path.join(dir,'isolated.db');
const { db, installBookContent } = require('../app/db');
const V = require('../app/vocabulary');
const { reviewedExample } = require('../shared/content-batch');
const { improve, inventory, protectedDigest } = require('../scripts/content-quality');

test('reviewed examples require exact source and sense, not a shared headword', () => {
  const word = V.buildBook(V.CATALOG.find(s=>s.file==='cet4.txt')).words.find(w=>w.word==='library');
  assert.ok(reviewedExample(word));
  assert.equal(reviewedExample({...word,meaning:'自建释义'}),null);
  assert.equal(reviewedExample({...word,source_file:null}),null);
  assert.equal(reviewedExample({...word,homograph:1}),null);
  assert.equal(reviewedExample({...word,source_raw:'different source'}),null);
});

test('all-book batch is additive, source guarded, dry-runnable and idempotent', t => {
  t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
  db.exec('BEGIN');
  for (const spec of V.CATALOG) {
    const id = Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run(spec.name).lastInsertRowid);
    installBookContent(id,spec);
  }
  db.exec('COMMIT');
  // Simulate an upgraded installation with empty examples and old pronunciations.
  db.exec("UPDATE words SET example='',example_translation=''; UPDATE words SET phonetic='inˈvєәriәbli' WHERE word='invariably' AND source_file='cet6.txt'");
  const lib = db.prepare("SELECT id FROM words WHERE word='library' AND source_file='cet4.txt'").get().id;
  db.prepare('INSERT INTO progress(word_id,correct,wrong,review_level,next_due) VALUES(?,4,1,3,?)').run(lib,'2026-10-20 08:00:00');
  db.prepare("INSERT INTO recall_cycles(word_id,cycle_id,state_json) VALUES(?,'saved-cycle','{}')").run(lib);
  db.prepare("UPDATE wordbooks SET plan_active=1,daily_new=17,target_date='2027-01-01' WHERE name='四级核心词汇'").run();
  db.exec("UPDATE words SET meaning='手改含义' WHERE source_file='cet4.txt' AND word='borrow'; UPDATE words SET example='Keep this partial entry.' WHERE source_file='cet4.txt' AND word='arrive'; UPDATE words SET phonetic='my-own-ipa' WHERE source_file='cet4.txt' AND word='forest'; INSERT INTO wordbooks(name,is_builtin) VALUES('自建词库',0)");
  const custom = Number(db.prepare("SELECT id FROM wordbooks WHERE name='自建词库'").get().id);
  db.prepare("INSERT INTO words(book_id,word,pos,meaning) VALUES(?,'library','n.','图书馆')").run(custom);
  // Guard a whole source build even when every individual row otherwise matches.
  db.exec("UPDATE vocabulary_builds SET source_sha256='modified' WHERE book_id=(SELECT id FROM wordbooks WHERE name='考研大纲词汇')");
  const before = protectedDigest(db), dry = improve(db);
  assert.equal(protectedDigest(db),before);
  assert.equal(db.prepare('SELECT example FROM words WHERE id=?').get(lib).example,'');
  assert.ok(dry.results.find(r=>r.book==='四级核心词汇').examples_added>20);
  assert.equal(dry.results.find(r=>r.book==='考研大纲词汇').skipped,'source-hash-mismatch');
  assert.throws(()=>improve(db,{apply:true,verify(){throw new Error('Review allowlist rejected');}}),/allowlist rejected/);
  assert.equal(protectedDigest(db),before);
  assert.equal(db.prepare('SELECT example FROM words WHERE id=?').get(lib).example,'');
  const applied = improve(db,{apply:true});
  assert.equal(applied.learning_and_plans_unchanged,true);
  assert.equal(protectedDigest(db),before);
  assert.ok(db.prepare('SELECT example FROM words WHERE id=?').get(lib).example.includes('library'));
  assert.equal(db.prepare("SELECT example FROM words WHERE book_id=?").get(custom).example,'');
  assert.equal(db.prepare("SELECT example FROM words WHERE source_file='cet4.txt' AND word='borrow'").get().example,'');
  assert.equal(db.prepare("SELECT example_translation FROM words WHERE source_file='cet4.txt' AND word='arrive'").get().example_translation,'');
  assert.equal(db.prepare("SELECT example FROM words WHERE source_file='cet4.txt' AND word='forest'").get().example,'');
  assert.equal(db.prepare("SELECT phonetic FROM words WHERE source_file='cet6.txt' AND word='invariably'").get().phonetic,'ɪnˈveəriəbli');
  assert.equal(improve(db,{apply:true}).results.filter(r=>!r.skipped).reduce((n,r)=>n+r.examples_added+r.phonetics_patched,0),0);
  const report = inventory(db);
  assert.equal(report.books.length,V.CATALOG.length);
  for (const book of report.books) {
    assert.equal(book.total_installed,book.items.length);
    assert.equal(book.paired_examples+book.pending_examples,book.total_installed);
    assert.ok(book.items.every(item=>item.language_review==='pending-full-review'));
  }
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
});
