'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const batch=require('../app/seed/examples-cet6-reviewed-20261021.json');

test('73 reviewed CET6 pairs reach the shipped lookup by exact source; draft status and held POS conflicts remain intact',()=>{
 const rows=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt')).words;
 assert.equal(batch.examples.length,73);
 assert.equal(new Set(batch.examples.map(e=>e.word)).size,73);
 assert.deepEqual(batch.held.map(e=>e.word),['recover','regulation']);
 for(const e of batch.examples){
  const row=rows.find(w=>w.word===e.word);assert.ok(row,e.word);
  assert.deepEqual(reviewedExample(row),{text:e.text,translation:e.translation});
  const result=JSON.parse(fs.readFileSync(path.join(__dirname,'..',e.candidate.file),'utf8'));
  const draft=result.entries[e.candidate.row_index];
  assert.deepEqual(draft.identity,Object.fromEntries(Object.keys(draft.identity).map(k=>[k,e[k]])));
  assert.equal(draft.verification,'needs-review');
  assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);
  assert.equal(e.text,draft.proposed.example);assert.equal(e.translation,draft.proposed.example_translation);
  for(const edit of [{source_line:row.source_line+1},{source_raw:'edited'},{meaning:'edited'},
   {pos:'edited'},{source_file:'custom.txt'},{headword:'other'},{homograph:1}]){
   assert.equal(reviewedExample({...row,...edit}),null,e.word+JSON.stringify(edit));
  }
 }
});

test('CET6 promotion fills blank pairs only, protects all learning data and is idempotent',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-cet6-promotion-'));
 const file=path.join(dir,'fixture.db');process.env.WORDMASTER_DB_PATH=file;
 const {db}=require('../app/db');
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const {upgradeContent}=require('../app/content-upgrade'),{protectedDigest}=require('../app/content-maintenance');
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt'));
 const id=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run('六级核心词汇').lastInsertRowid);
 db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(id,'2026-10-17.1',built.report.sha256,JSON.stringify({...built.report,version:'2026-10-17.1'}));
 const insert=db.prepare('INSERT INTO words(book_id,word,headword,homograph,pos,meaning,phonetic,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?,?)');
 for(const e of batch.examples){const w=built.words.find(w=>w.word===e.word);insert.run(id,w.word,w.headword,w.homograph,w.pos,w.meaning,w.phonetic,w.source_file,w.source_line,w.source_raw);}
 const first=db.prepare('SELECT id FROM words ORDER BY id LIMIT 1').get().id;
 db.prepare('UPDATE words SET example=? WHERE id=?').run('My own sentence.',first);
 db.prepare('INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,3,2,?)').run(first,'2026-12-01');
 db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,1)').run(first);
 const before=protectedDigest(db),words=db.prepare('SELECT * FROM words ORDER BY id').all();
 const out=await upgradeContent(db,{databasePath:file});assert.equal(out.counts.examples,72);
 assert.equal(out.counts.meanings,0);assert.equal(out.counts.phonetics,0);
 assert.equal(protectedDigest(db),before);
 for(const old of words){const next=db.prepare('SELECT * FROM words WHERE id=?').get(old.id);for(const key of Object.keys(old))if(!['example','example_translation'].includes(key))assert.equal(next[key],old[key]);}
 assert.equal(db.prepare('SELECT example_translation FROM words WHERE id=?').get(first).example_translation,'');
 assert.equal((await upgradeContent(db,{databasePath:file})).status,'up-to-date');
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});
