'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const V=require('../app/vocabulary');
const {reviewedMeaning}=require('../shared/content-corrections');
const {reviewedExample}=require('../shared/content-batch');
const patches=require('../app/seed/meanings-targeted-20261017.json');

function originalWord(p) {
  const parsed=V.parseSourceLine(p.source_raw);
  assert.equal(parsed.status,'accepted',p.word+' source parse');
  const word={...parsed.entry,source_file:p.source_file,
    source_line:p.source_line,source_raw:p.source_raw};
  for(const field of ['word','headword','homograph'])
    assert.deepEqual(word[field],p[field],p.word+' '+field);
  for(const field of ['pos','meaning','phonetic'])
    assert.equal(word[field],p.from[field],p.word+' original '+field);
  return word;
}

test('three TEM corrections retain source identity and have independently checked bilingual examples',()=>{
  assert.deepEqual(patches.map(p=>p.word),['subjective','tuck','unawares']);
  const unique=new Set(patches.map(p=>p.source_file+':'+p.source_line+':'+p.word));
  assert.equal(unique.size,3);
  const book=V.buildBook(V.CATALOG.find(c=>c.file==='tem.txt'));
  for(const p of patches){
    const original=originalWord(p);
    assert.equal(reviewedMeaning(original),p);
    const built=book.words.find(w=>w.word===p.word && w.source_line===p.source_line);
    assert.ok(built,p.word+' exists in built-in vocabulary');
    assert.equal(built.meaning,p.to.meaning);
    assert.equal(built.source_raw,p.source_raw);
    assert.deepEqual(reviewedExample(built),p.example);
    assert.equal(p.external_human_review,false);
    assert.equal(p.full_dictionary_senses_reviewed,false);
    assert.ok(p.source.startsWith('https://'));
    for(const edit of [
      {source_line:p.source_line+1},{source_file:'cet4.txt'},
      {source_raw:'changed original'}, {headword:'another-word'},
      {meaning:'我的自定义释义'}, {phonetic:'custom pronunciation'},
      {homograph:1}
    ])assert.equal(reviewedMeaning({...original,...edit}),null,
      p.word+' incorrect source guard accepted');
  }
  const get=word=>patches.find(p=>p.word===word).to.meaning;
  assert.ok(!get('subjective').endsWith('依据的'));
  assert.ok(!get('tuck').includes('打褶桐'));
  assert.ok(!get('unawares').includes('吃惊地'));
});

test('content upgrade installs only source-matched TEM edits, backs up and retains learning and user edits',async t=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'wordmaster-tem-targeted-'));
  const file=path.join(temp,'test.db');
  process.env.WORDMASTER_DB_PATH=file;
  const {db}=require('../app/db');
  const {upgradeContent}=require('../app/content-upgrade');
  const {protectedDigest}=require('../app/content-maintenance');
  t.after(()=>{db.close();fs.rmSync(temp,{recursive:true,force:true});});
  const spec=V.CATALOG.find(s=>s.file==='tem.txt'),built=V.buildBook(spec);
  const id=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)')
    .run(spec.name).lastInsertRowid);
  db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(
    id,'2026-10-15.9',built.report.sha256,'{}');
  const ids={};
  for(const p of patches){
    const word=originalWord(p);
    ids[p.word]=Number(db.prepare(
      'INSERT INTO words(book_id,word,headword,homograph,pos,meaning,phonetic,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?,?)'
    ).run(id,p.word,p.headword,p.homograph,
      word.pos,word.meaning,word.phonetic,p.source_file,p.source_line,p.source_raw).lastInsertRowid);
  }
  // Student-authored content must not be replaced by a maintenance upgrade.
  db.prepare('UPDATE words SET meaning=? WHERE id=?').run('我自己修改过的释义',ids.tuck);
  db.prepare('UPDATE words SET example=? WHERE id=?').run('My own subjective example.',ids.subjective);
  db.prepare('INSERT INTO progress(word_id,correct,wrong,streak,next_due) VALUES(?,?,?,?,?)')
    .run(ids.unawares,3,2,1,'2026-12-01 00:00:00');
  db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,?)').run(ids.unawares,0);
  const preserved=protectedDigest(db);
  const before=db.prepare('SELECT * FROM words ORDER BY id').all();
  const upgraded=await upgradeContent(db,{databasePath:file});
  assert.equal(upgraded.status,'applied');
  assert.equal(upgraded.counts.meanings,2);
  assert.equal(upgraded.counts.examples,1);
  assert.equal(upgraded.protected_state_unchanged,true);
  assert.equal(protectedDigest(db),preserved);
  assert.ok(fs.existsSync(upgraded.backupFile));
  const old=new DatabaseSync(upgraded.backupFile,{readOnly:true});
  try{assert.deepEqual(old.prepare('SELECT * FROM words ORDER BY id').all(),before)}
  finally{old.close();}
  const lookup=word=>db.prepare('SELECT * FROM words WHERE id=?').get(ids[word]);
  assert.equal(lookup('subjective').meaning,patches[0].to.meaning);
  assert.equal(lookup('subjective').example,'My own subjective example.');
  assert.equal(lookup('subjective').example_translation,'');
  assert.equal(lookup('tuck').meaning,'我自己修改过的释义');
  assert.equal(lookup('tuck').example,'');
  assert.equal(lookup('unawares').meaning,patches[2].to.meaning);
  assert.equal(lookup('unawares').example,patches[2].example.text);
  assert.equal(lookup('unawares').example_translation,patches[2].example.translation);
  assert.equal(db.prepare('SELECT content_version FROM vocabulary_builds WHERE book_id=?')
    .get(id).content_version,V.VERSION);
  const final=db.prepare('SELECT * FROM words ORDER BY id').all();
  const backupDir=path.dirname(upgraded.backupFile),beforeRerun=fs.readdirSync(backupDir).sort();
  const rerun=await upgradeContent(db,{databasePath:file});
  assert.equal(rerun.status,'up-to-date');
  assert.deepEqual(db.prepare('SELECT * FROM words ORDER BY id').all(),final);
  assert.deepEqual(fs.readdirSync(backupDir).sort(),beforeRerun);
});
