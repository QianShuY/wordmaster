'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-meanings-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'fixture.db');
const {db}=require('../app/db'),V=require('../app/vocabulary'),{improve,protectedDigest}=require('../scripts/content-quality'),patches=require('../app/seed/meanings-reviewed-20261014.json');
test('meaning upgrades roll back on verification failure and preserve edits, IPA, partial examples, IDs and learning',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const books=new Map();
 for(const file of ['cet4.txt','tem.txt']){
  const spec=V.CATALOG.find(s=>s.file===file),built=V.buildBook(spec),id=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run(spec.name).lastInsertRowid);
  books.set(file,id);db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(id,V.VERSION,built.report.sha256,JSON.stringify(built.report));
 }
 for(const p of patches)db.prepare('INSERT INTO words(book_id,word,headword,homograph,pos,meaning,phonetic,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?,?)').run(books.get(p.source_file),p.word,p.headword,p.homograph,p.from.pos,p.from.meaning,p.from.phonetic,p.source_file,p.source_line,p.source_raw);
 db.exec("UPDATE words SET meaning='自己的银行释义' WHERE word='bank'; UPDATE words SET phonetic='my-own-ipa' WHERE word='ankle'; UPDATE words SET example='My own baseball sentence.' WHERE word='baseball'");
 const billion=db.prepare("SELECT id FROM words WHERE word='billion' AND source_file='cet4.txt'").get().id;
 db.prepare("INSERT INTO progress(word_id,correct,wrong,streak,next_due) VALUES(?,4,2,2,'2026-11-01 12:00:00')").run(billion);
 db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,0)').run(billion);
 const protectedBefore=protectedDigest(db),before=JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all());
 assert.throws(()=>improve(db,{apply:true,verify(){throw new Error('reject meaning transaction');}}),/reject meaning transaction/);
 assert.equal(JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all()),before);
 const result=improve(db,{apply:true});assert.equal(result.results.reduce((n,r)=>n+(r.meanings_patched||0),0),5);
 assert.equal(result.results.reduce((n,r)=>n+(r.examples_added||0),0),4);
 assert.equal(protectedDigest(db),protectedBefore);
 assert.equal(db.prepare("SELECT meaning FROM words WHERE word='bank'").get().meaning,'自己的银行释义');
 assert.equal(db.prepare("SELECT phonetic FROM words WHERE word='ankle'").get().phonetic,'my-own-ipa');
 assert.equal(db.prepare("SELECT example_translation FROM words WHERE word='baseball'").get().example_translation,'');
 assert.equal(db.prepare("SELECT example FROM words WHERE word='baseball'").get().example,'My own baseball sentence.');
 assert.ok(db.prepare('SELECT meaning FROM words WHERE id=?').get(billion).meaning.includes('现代通用'));
 const again=improve(db,{apply:true});assert.equal(again.results.reduce((n,r)=>n+(r.examples_added||0)+(r.meanings_patched||0)+(r.phonetics_patched||0),0),0);
});
