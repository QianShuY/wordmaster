'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-symbols-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'fixture.db');
const {db}=require('../app/db'),V=require('../app/vocabulary'),{reviewedSymbol}=require('../shared/phonetic-symbols'),{improve,protectedDigest}=require('../scripts/content-quality'),{audit}=require('../scripts/check-phonetic-characters');
const patches=require('../app/seed/phonetic-symbols-20261015.json');
const dictionary=require('../app/seed/phonetics-private-use-20261015.json');
test('private-use replacements are dictionary and primary-POS bound instead of guessed font substitutions',()=>{
 const {reviewedPhonetic}=require('../shared/content-batch'),built=V.buildBook(V.CATALOG.find(s=>s.file==='cet4.txt'));
 assert.deepEqual(dictionary.map(p=>p.to.phonetic),['ˈpleɪɡraʊnd','sɪnˈθetɪk']);
 for(const p of dictionary){const w={...p,...p.from};assert.equal(reviewedPhonetic(w),p);for(const change of [{phonetic:'own'},{meaning:'自建'},{pos:'v.'},{source_raw:'changed'},{source_line:0}])assert.equal(reviewedPhonetic({...w,...change}),null);assert.equal(built.words.find(w=>w.word===p.word).phonetic,p.to.phonetic);}
});
test('488 symbol conversions bind all original source fields and never rewrite user imports or claim language approval',()=>{
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='cet4.txt'));
 assert.equal(patches.length,488);
 for(const p of patches){const w={...p,...p.from};assert.equal(reviewedSymbol(w),p);assert.equal(p.to.phonetic,p.from.phonetic.replaceAll('∫','ʃ'));assert.equal(p.full_pronunciation_reviewed,false);
  for(const change of [{phonetic:'my pronunciation'},{meaning:'自建释义'},{pos:'own'},{source_file:'custom'},{source_line:p.source_line+1},{source_raw:'changed'},{headword:'changed'},{homograph:999}])assert.equal(reviewedSymbol({...w,...change}),null);
  const actual=built.words.find(w=>w.word===p.word);assert.equal(actual.phonetic,p.to.phonetic);assert.equal(actual.source_raw,p.source_raw);
 }
 const p=patches[0],parsed=V.parseImportLine(p.source_raw);assert.ok(parsed.phonetic.includes('∫'));assert.equal(reviewedSymbol(parsed),null);
});
test('symbol maintenance preserves partial examples, edited IPA, all records and rollback; private-use faults remain visible',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const spec=V.CATALOG.find(s=>s.file==='cet4.txt'),built=V.buildBook(spec),book=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run(spec.name).lastInsertRowid);
 db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(book,V.VERSION,built.report.sha256,JSON.stringify(built.report));
 for(const p of [...patches,...dictionary])db.prepare('INSERT INTO words(book_id,word,headword,homograph,pos,meaning,phonetic,source_file,source_line,source_raw,example) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(book,p.word,p.headword,p.homograph??null,p.from.pos,p.from.meaning,p.from.phonetic,p.source_file,p.source_line,p.source_raw,'Keep my sentence.');
 const first=db.prepare('SELECT * FROM words ORDER BY id LIMIT 1').get();db.prepare('UPDATE words SET phonetic=? WHERE id=?').run('own ∫',first.id);
 db.prepare('INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,4,2,?)').run(first.id,'2026-11-20');db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,0)').run(first.id);
 const before=JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all()),protectedBefore=protectedDigest(db);
 assert.throws(()=>improve(db,{apply:true,verify(){throw Error('forced symbol rollback');}}),/forced symbol rollback/);assert.equal(JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all()),before);
 const result=improve(db,{apply:true}),sum=k=>result.results.reduce((n,r)=>n+(r[k]||0),0);assert.equal(sum('phonetics_patched'),489);assert.equal(sum('meanings_patched'),2);assert.equal(sum('examples_added'),0);assert.equal(protectedDigest(db),protectedBefore);
 assert.equal(db.prepare("SELECT meaning FROM words WHERE word='duration'").get().meaning,'持续时间，期间');
 assert.equal(db.prepare('SELECT phonetic FROM words WHERE id=?').get(first.id).phonetic,'own ∫');assert.equal(db.prepare('SELECT count(*) n FROM words WHERE example_translation!=?').get('').n,0);
 assert.equal(improve(db,{apply:true}).results.reduce((n,r)=>n+(r.phonetics_patched||0),0),0);
 db.prepare('UPDATE words SET phonetic=? WHERE id=?').run('\uF063',first.id);const report=audit(db);assert.equal(report.flagged,1);assert.ok(report.items[0].flags.includes('private-use-or-replacement-character'));
});
