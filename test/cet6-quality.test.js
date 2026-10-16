'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-cet6-quality-'));process.env.WORDMASTER_DB_PATH=path.join(dir,'test.db');
const {db,installBookContent}=require('../app/db'),V=require('../app/vocabulary'),D=require('../shared/domain');
const {improve,digestLearning}=require('../scripts/improve-cet6');
test('CET6 meaning groups retain other parts of speech, phrase notes and alternate pronunciation',()=>{
 const rows=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt')).words;
 const get=head=>D.sampleWordPresentation(rows.find(w=>w.word===head),{is_builtin:1});
 const shuttle=get('shuttle');assert.deepEqual(shuttle.meaning_groups.map(g=>g.heading),['n.','v.']);
 assert.ok(shuttle.meaning_notes[0].text.includes('shuttle diplomacy'));
 assert.ok(!shuttle.meaning_groups.flatMap(g=>g.items).join('').includes('shuttle diplomacy'));
 const abuse=get('abuse');assert.equal(abuse.meaning_groups[1].phonetic,'əˈbjuːs');
 assert.ok(abuse.meaning_groups.every(g=>g.items.every(item=>!item.includes('['))));
 const incline=get('incline');assert.equal(incline.meaning_groups[0].items.length,4);assert.equal(incline.meaning_groups[1].heading,'n.');
 for(const w of rows){const structured=D.sampleWordPresentation(w,{is_builtin:1});assert.ok(structured.meaning_groups.length,w.word);assert.ok(structured.meaning_groups.every(g=>g.items.length),w.word);}
});
test('scoped improvement preserves study records, edited content, word IDs and custom words, and is idempotent',t=>{
 t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true});});
 const spec=V.CATALOG.find(s=>s.file==='cet6.txt');
 db.exec("INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,'六级核心词汇',1),(2,'custom',0)");installBookContent(1,spec);
 db.exec("UPDATE words SET example='',example_translation='' WHERE book_id=1; INSERT INTO words(book_id,word,pos,meaning,example) VALUES(2,'define','v.','自建释义','私有例句');");
 const define=db.prepare("SELECT id FROM words WHERE book_id=1 AND word='define'").get().id;
 db.prepare("INSERT INTO progress(word_id,correct,wrong,streak,review_level,next_due,first_studied) VALUES(?,3,1,2,2,'2026-10-15 10:00:00','2026-10-11 10:00:00')").run(define);
 db.prepare("INSERT INTO review_log(word_id,correct,practice_mode) VALUES(?,1,'spelling')").run(define);
 db.prepare("UPDATE words SET example='My own sentence.',example_translation='自己的例句。' WHERE id=?").run(define);
 db.exec("UPDATE words SET phonetic='әˈbɒːʃәn' WHERE word='abortion'; UPDATE words SET phonetic='ˈæɡrɪɡeɪt' WHERE word='aggregate'; UPDATE words SET meaning='手动修改' WHERE word='abnormal'");
 const before=digestLearning(),dry=improve();assert.ok(dry.examples_added>100);assert.equal(digestLearning(),before);
 const applied=improve({apply:true});assert.equal(applied.phonetics_patched,2);assert.equal(applied.learning_unchanged,true);assert.equal(digestLearning(),before);
 assert.equal(db.prepare('SELECT example FROM words WHERE id=?').get(define).example,'My own sentence.');
 assert.equal(db.prepare("SELECT meaning FROM words WHERE word='abnormal'").get().meaning,'手动修改');
 assert.equal(db.prepare("SELECT example FROM words WHERE book_id=2").get().example,'私有例句');
 const again=improve({apply:true});assert.equal(again.examples_added,0);assert.equal(again.phonetics_patched,0);
 assert.equal(db.prepare("SELECT phonetic FROM words WHERE word='aggregate'").get().phonetic,'ˈæɡrɪɡət');
});
