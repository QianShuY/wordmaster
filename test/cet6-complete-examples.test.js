'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const batch=require('../app/seed/examples-cet6-complete-reviewed-20261021.json');
const {rules}=require('../scripts/audit-abc-example-quality');

test('whole CET6 example set is source-bound, has no template fallbacks and retains six explicit lexical conflicts',()=>{
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt'));
 const words=new Map(built.words.map(w=>[w.word,w]));
 const tasks=new Map();
 assert.equal(batch.examples.length,1846);assert.equal(new Set(batch.examples.map(e=>e.word)).size,1846);
 assert.equal(batch.editorial_revisions.length,93);
 assert.deepEqual(batch.held.map(e=>e.word),['constant','correlate','despite','elapse','recover','regulation']);
 for(const e of batch.examples){
  const w=words.get(e.word);assert.ok(w,e.word);
  assert.deepEqual(reviewedExample(w),{text:e.text,translation:e.translation},e.word);
  if(!tasks.has(e.candidate.task_id))tasks.set(e.candidate.task_id,JSON.parse(fs.readFileSync(path.join(__dirname,'..',batch.tasks[e.candidate.task_id].file),'utf8')));
  const row=tasks.get(e.candidate.task_id).entries[e.candidate.row_index];
  assert.equal(row.verification,'needs-review');
  assert.deepEqual(row.identity,Object.fromEntries(Object.keys(row.identity).map(k=>[k,e[k]])));
  assert.equal(e.pos,w.pos);assert.equal(e.meaning,w.meaning);
  const correction=batch.editorial_revisions.find(r=>r.word===e.word);
  assert.deepEqual({text:e.text,translation:e.translation},correction?.after||{text:row.proposed.example,translation:row.proposed.example_translation});
  if(correction)assert.deepEqual(correction.before,{text:row.proposed.example,translation:row.proposed.example_translation});
  assert.ok(e.text&&/[\u3400-\u9fff]/.test(e.translation));
  assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);
  assert.ok(!rules.some(r=>r.pattern.test(r.id==='translation-metalinguistic'?e.translation:e.text)),e.word);
  for(const edit of [{source_file:'custom.txt'},{source_line:w.source_line+1},{source_raw:'edited'},
   {meaning:'edited'},{pos:'edited'},{headword:'other'},{homograph:w.homograph===null?1:null}])assert.equal(reviewedExample({...w,...edit}),null,e.word+JSON.stringify(edit));
 }
 for(const e of batch.held)assert.ok(!batch.examples.some(x=>x.word===e.word));
 const byWord=new Map(batch.examples.map(e=>[e.word,e]));
 assert.match(byWord.get('penalty').text,/paid a penalty/);
 assert.match(byWord.get('slump').text,/Sales slumped/);
 assert.match(byWord.get('subsidiary').text,/subsidiary company/);
 assert.match(byWord.get('traverse').text,/traversed the valley/);
});

test('whole-book incremental install adds 1845 blank pairs while preserving a custom pair, every other word field and saved progress',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-cet6-complete-'));const file=path.join(dir,'fixture.db');process.env.WORDMASTER_DB_PATH=file;
 const {db}=require('../app/db');t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const {upgradeContent}=require('../app/content-upgrade'),{protectedDigest}=require('../app/content-maintenance');
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt')),map=new Map(built.words.map(w=>[w.word,w]));
 const id=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run('六级核心词汇').lastInsertRowid);
 db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(id,'2026-10-21.1',built.report.sha256,JSON.stringify({...built.report,version:'2026-10-21.1'}));
 const add=db.prepare('INSERT INTO words(book_id,word,headword,homograph,pos,meaning,phonetic,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?,?)');
 for(const e of batch.examples){const w=map.get(e.word);add.run(id,w.word,w.headword,w.homograph,w.pos,w.meaning,w.phonetic,w.source_file,w.source_line,w.source_raw);}
 const first=db.prepare('SELECT id FROM words ORDER BY id LIMIT 1').get().id;
 db.prepare('UPDATE words SET example=?,example_translation=? WHERE id=?').run('My sentence.','我的句子。',first);
 db.prepare('INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,3,2,?)').run(first,'2026-12-01');
 db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,1)').run(first);
 const before=protectedDigest(db),words=db.prepare('SELECT * FROM words ORDER BY id').all();
 const result=await upgradeContent(db,{databasePath:file});assert.deepEqual(result.counts,{examples:1845,meanings:0,phonetics:0});
 assert.equal(protectedDigest(db),before);
 const after=db.prepare('SELECT * FROM words ORDER BY id').all();
 for(let i=0;i<words.length;i++)for(const key of Object.keys(words[i]))if(!['example','example_translation'].includes(key))assert.equal(words[i][key],after[i][key]);
 assert.equal(db.prepare('SELECT example FROM words WHERE id=?').get(first).example,'My sentence.');
 assert.equal((await upgradeContent(db,{databasePath:file})).status,'up-to-date');
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});
