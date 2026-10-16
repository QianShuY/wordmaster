'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-missing-ipa-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'fixture.db');
const {db}=require('../app/db'),V=require('../app/vocabulary'),D=require('../shared/domain');
const patches=require('../app/seed/phonetics-missing-reviewed-20261014.json');
const {reviewedPhonetic}=require('../shared/content-batch'),{reviewedMeaning}=require('../shared/content-corrections');
const {improve,protectedDigest}=require('../scripts/content-quality');
test('102 missing pronunciations bind original source and retain distinct POS pronunciation groups',()=>{
 assert.equal(patches.length,102);const built=new Map(V.CATALOG.map(s=>[s.file,V.buildBook(s)]));
 for(const p of patches){
  const original={...p,...p.from};assert.equal(reviewedPhonetic(original),p);
  for(const changed of [{phonetic:'custom'},{meaning:'手改释义'},{source_line:p.source_line+1},{source_raw:'edited'},{homograph:1}])assert.equal(reviewedPhonetic({...original,...changed}),null);
  const actual=built.get(p.source_file).words.find(w=>w.word===p.word);
  assert.equal(actual.phonetic,p.to.phonetic);assert.equal(actual.meaning,p.to.meaning||p.from.meaning);
  assert.equal(actual.source_raw,p.source_raw);assert.equal(new URL(p.source).protocol,'https:');
  if(p.to.meaning)assert.equal(reviewedMeaning(original),p);
 }
 const groups=word=>{const p=patches.find(p=>p.word===word);return D.structureMeaning(p.from.pos,p.to.meaning).meaning_groups;};
 for(const [word,ipa] of [['approximate','əˈprɒksɪmeɪt'],['hinder','ˈhaɪndə'],['transfer','ˈtrænsfɜː(r)'],['transport','ˈtrænspɔːt'],['grown-up','ˈɡrəʊnʌp']]){
  assert.ok(groups(word).length>=2,word);assert.ok(JSON.stringify(groups(word)).includes(ipa),word);
 }
 assert.ok(patches.find(p=>p.word==='Negro').to.meaning.includes('冒犯'));
 assert.ok(patches.find(p=>p.word==='oriental').to.meaning.includes('指人'));
});
test('combined IPA and meaning maintenance is atomic, preserves edits and learning, and applies once',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const ids=new Map();
 for(const file of [...new Set(patches.map(p=>p.source_file))]){
  const spec=V.CATALOG.find(s=>s.file===file),built=V.buildBook(spec);
  const id=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run(spec.name).lastInsertRowid);ids.set(file,id);
  db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(id,V.VERSION,built.report.sha256,JSON.stringify(built.report));
 }
 for(const p of patches)db.prepare('INSERT INTO words(book_id,word,headword,pos,meaning,phonetic,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?)').run(ids.get(p.source_file),p.word,p.headword,p.from.pos,p.from.meaning,'',p.source_file,p.source_line,p.source_raw);
 db.exec("UPDATE words SET phonetic='personal IPA' WHERE word='a'; UPDATE words SET meaning='个人含义' WHERE word='leading'");
 const transfer=db.prepare("SELECT id FROM words WHERE word='transfer'").get().id;
 db.prepare('INSERT INTO progress(word_id,correct,wrong,review_level,next_due) VALUES(?,3,2,2,?)').run(transfer,'2026-11-02 12:00:00');
 const protectedBefore=protectedDigest(db),before=JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all());
 assert.throws(()=>improve(db,{apply:true,verify(){throw new Error('reject combined transaction');}}),/reject combined/);
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all()),before);
 const result=improve(db,{apply:true});assert.equal(result.results.reduce((n,r)=>n+(r.phonetics_patched||0),0),100);
 assert.equal(result.results.reduce((n,r)=>n+(r.meanings_patched||0),0),7);assert.equal(protectedDigest(db),protectedBefore);
 assert.equal(db.prepare("SELECT phonetic FROM words WHERE word='a'").get().phonetic,'personal IPA');
 assert.equal(db.prepare("SELECT phonetic FROM words WHERE word='leading'").get().phonetic,'');
 assert.equal(improve(db,{apply:true}).results.reduce((n,r)=>n+(r.phonetics_patched||0)+(r.meanings_patched||0)+(r.examples_added||0),0),0);
});
