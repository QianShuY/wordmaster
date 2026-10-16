'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-deferred-meanings-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'fixture.db');
const {db}=require('../app/db'),V=require('../app/vocabulary'),D=require('../shared/domain'),{reviewedMeaning}=require('../shared/content-corrections'),{reviewedExample}=require('../shared/content-batch'),{improve,protectedDigest}=require('../scripts/content-quality');
const patches=require('../app/seed/meanings-deferred-reviewed-20261014.json');
test('53 historical conflicts resolve only exact original fields and teach explicit meanings or valency',()=>{
 assert.equal(patches.length,53);const built=new Map(V.CATALOG.map(s=>[s.file,V.buildBook(s)]));
 for(const p of patches){
  const original={...p,...p.from};assert.equal(reviewedMeaning(original),p);assert.equal(reviewedExample(original),null);
  for(const changed of [{meaning:'自建含义'},{phonetic:'own IPA'},{source_line:p.source_line+1},{source_raw:'edited'},{headword:'other'},{homograph:1}])assert.equal(reviewedMeaning({...original,...changed}),null);
  const w=built.get(p.source_file).words.find(w=>w.word===p.word);assert.equal(w.meaning,p.to.meaning);assert.equal(w.phonetic,require('../shared/phonetic-symbols').canonicalPhonetic({...original,meaning:p.to.meaning}));assert.equal(w.source_raw,p.source_raw);assert.deepEqual(reviewedExample(w),p.example);
 }
 const get=(file,word)=>built.get(file).words.find(w=>w.word===word);
 assert.equal(get('npee.txt','airline').meaning,'航空公司');assert.ok(!get('tem.txt','bored').meaning.includes('烦人'));
 assert.ok(get('tem.txt','branch').meaning.includes('树枝'));assert.ok(!/[\uE000-\uF8FF]/.test(get('npee.txt','common').meaning));
 for(const word of ['adapt','apply','concentrate','cheer']){const w=get('cet4.txt',word),g=D.structureMeaning(w.pos,w.meaning).meaning_groups;assert.ok(g.some(x=>x.heading==='vi.'),word);}
 assert.ok(get('tem.txt','attach').meaning.includes('电子邮件'));assert.ok(get('cet4.txt','captain').meaning.includes('陆军上尉'));
});
test('deferred meaning application is atomic, skips user changes, preserves partial examples and all saved learning',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});const ids=new Map();
 for(const file of [...new Set(patches.map(p=>p.source_file))]){const spec=V.CATALOG.find(s=>s.file===file),built=V.buildBook(spec),id=Number(db.prepare('INSERT INTO wordbooks(name,is_builtin) VALUES(?,1)').run(spec.name).lastInsertRowid);ids.set(file,id);db.prepare('INSERT INTO vocabulary_builds VALUES(?,?,?,?)').run(id,V.VERSION,built.report.sha256,JSON.stringify(built.report));}
 for(const p of patches)db.prepare('INSERT INTO words(book_id,word,headword,pos,meaning,phonetic,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?)').run(ids.get(p.source_file),p.word,p.headword,p.from.pos,p.from.meaning,p.from.phonetic,p.source_file,p.source_line,p.source_raw);
 db.exec("UPDATE words SET meaning='我自己的亲属解释' WHERE source_file='cet4.txt' AND word='aunt'; UPDATE words SET phonetic='my-ipa' WHERE source_file='tem.txt' AND word='attach'; UPDATE words SET example='My own airline example.' WHERE word='airline'");
 const id=db.prepare("SELECT id FROM words WHERE word='class'").get().id;db.prepare('INSERT INTO progress(word_id,correct,wrong,next_due) VALUES(?,4,2,?)').run(id,'2026-11-15');db.prepare('INSERT INTO review_log(word_id,correct) VALUES(?,0)').run(id);
 db.exec("INSERT INTO cards(id,title,category,rarity,palette) VALUES(99,'保留收藏','测试','N','ink');INSERT INTO user_cards(card_id) VALUES(99)");
 const protectedBefore=protectedDigest(db),before=JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all());
 assert.throws(()=>improve(db,{apply:true,verify(){throw Error('reject deferred transaction');}}),/reject deferred/);assert.equal(JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all()),before);
 const result=improve(db,{apply:true});assert.equal(result.results.reduce((n,r)=>n+(r.meanings_patched||0),0),51);assert.equal(result.results.reduce((n,r)=>n+(r.examples_added||0),0),50);assert.equal(protectedDigest(db),protectedBefore);
 assert.equal(db.prepare("SELECT example_translation FROM words WHERE word='airline'").get().example_translation,'');
 assert.equal(improve(db,{apply:true}).results.reduce((n,r)=>n+(r.meanings_patched||0)+(r.examples_added||0)+(r.phonetics_patched||0),0),0);
});
