'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const V=require('../app/vocabulary'),patches=require('../app/seed/lexical-cet6-reviewed-20261022.json');
const {reviewedLexical,lexicalExample}=require('../shared/lexical-corrections');
const {reviewedExample}=require('../shared/content-batch');
test('the six held identities have verified lexical fixes, correctly separated senses and original examples',()=>{
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt'));
 assert.equal(patches.length,6);assert.equal(built.words.length,2272);
 for(const p of patches){
  const w=built.words.find(w=>w.word===p.word),old={...w,...p.from};
  assert.deepEqual(reviewedLexical(old),p);
  for(const key of ['pos','meaning','phonetic'])assert.equal(w[key],p.to[key]);
  assert.deepEqual(reviewedExample(w),p.example);assert.equal(reviewedLexical(w),null);
  assert.equal(lexicalExample(old),null);
  assert.equal(V.parseImportLine(p.source_raw).pos,p.from.pos,'user imports retain their own content');
  assert.ok(p.source.urls.every(url=>url.startsWith('https://')));
  for(const edit of [{source_file:'custom.txt'},{source_line:w.source_line+1},{source_raw:'edited'},
   {word:'other'},{headword:'other'},{homograph:1},{pos:'edited'},{meaning:'edited'},{phonetic:'edited'}]){
   assert.equal(reviewedLexical({...old,...edit}),null);assert.equal(lexicalExample({...w,...edit}),null);
  }
 }
 const D=require('../shared/domain');
 for(const head of ['correlate','despite','elapse']){
  const w=built.words.find(w=>w.word===head),groups=D.structureMeaning(w.pos,w.meaning).meaning_groups;
  assert.equal(groups.length,2,head);assert.ok(groups.every(g=>g.items.length>0),head);
 }
});
test('lexical upgrade backs up all six old rows, protects custom edits and saved learning, and rejects unrelated POS changes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-cet6-lexical-')),file=path.join(dir,'fixture.db');process.env.WORDMASTER_DB_PATH=file;
 const {db}=require('../app/db'),{upgradeContent}=require('../app/content-upgrade'),{protectedDigest}=require('../app/content-maintenance');
 const {DatabaseSync}=require('node:sqlite');
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt'));
 const book=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run('六级核心词汇').lastInsertRowid);
 db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(book,'2026-10-21.2',built.report.sha256,'{}');
 const add=db.prepare('INSERT INTO words(book_id,word,headword,homograph,pos,meaning,phonetic,source_file,source_line,source_raw,example,example_translation) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
 const ids=new Map();
 for(const p of patches)ids.set(p.word,Number(add.run(book,p.word,p.headword,p.homograph,p.from.pos,p.from.meaning,p.from.phonetic,p.source_file,p.source_line,p.source_raw,'','').lastInsertRowid));
 const custom=Number(add.run(book,'regulation-copy','regulation-copy',null,'custom.','我的释义','my IPA','custom.txt',1,'custom row','My pair.','我的例句。').lastInsertRowid);
 db.prepare('INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,3,2,?)').run(ids.get('recover'),'2026-12-01');
 db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,1)').run(ids.get('recover'));
 const before=db.prepare('SELECT * FROM words ORDER BY id').all(),protectedBefore=protectedDigest(db);
 await assert.rejects(upgradeContent(db,{databasePath:file,verify(){db.prepare("UPDATE words SET pos='v.' WHERE id=?").run(custom);}}),/unapproved field/);
 assert.deepEqual(db.prepare('SELECT * FROM words ORDER BY id').all(),before);
 const result=await upgradeContent(db,{databasePath:file});
 assert.deepEqual(result.counts,{examples:6,meanings:3,phonetics:1,parts_of_speech:6});
 assert.equal(protectedDigest(db),protectedBefore);
 const saved=new DatabaseSync(result.backupFile,{readOnly:true});assert.deepEqual(saved.prepare('SELECT * FROM words ORDER BY id').all(),before);saved.close();
 for(const p of patches){const w=db.prepare('SELECT * FROM words WHERE id=?').get(ids.get(p.word));for(const key of ['pos','meaning','phonetic'])assert.equal(w[key],p.to[key]);assert.equal(w.example,p.example.text);}
 assert.deepEqual(db.prepare('SELECT * FROM words WHERE id=?').get(custom),before.at(-1));
 assert.equal((await upgradeContent(db,{databasePath:file})).status,'up-to-date');
 // A later content version must preserve a user's edited meaning, IPA and pair.
 db.prepare('UPDATE words SET pos=?,meaning=?,phonetic=?,example=?,example_translation=? WHERE id=?').run('custom.','自定义','edited IPA','Edited.','已编辑。',ids.get('constant'));
 db.prepare("UPDATE vocabulary_builds SET content_version='older'").run();
 const edited=db.prepare('SELECT * FROM words WHERE id=?').get(ids.get('constant'));
 const again=await upgradeContent(db,{databasePath:file});assert.equal(again.edited_rows_preserved,2);
 assert.deepEqual(db.prepare('SELECT * FROM words WHERE id=?').get(ids.get('constant')),edited);
 assert.equal(protectedDigest(db),protectedBefore);assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});
