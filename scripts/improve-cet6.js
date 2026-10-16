'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {db}=require('../app/db'),V=require('../app/vocabulary'),D=require('../shared/domain');
const examples=require('../app/seed/reviewed-examples.json'),corrections=require('../app/seed/cet6-corrections.json');
const spec=V.CATALOG.find(s=>s.file==='cet6.txt');
function digestLearning(){
 const rows={};
 for(const table of ['progress','review_log','user_cards','card_draws','adventure_days','recall_cycles'])rows[table]=db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
 rows.wordIdentities=db.prepare('SELECT id,book_id,word FROM words ORDER BY id').all();
 return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}
function improve({apply=false}={}){
 const book=db.prepare('SELECT * FROM wordbooks WHERE name=? AND is_builtin=1').get(spec.name);
 if(!book)throw new Error('缺少内置六级词库');
 const built=V.buildBook(spec),build=db.prepare('SELECT * FROM vocabulary_builds WHERE book_id=?').get(book.id);
 if(!build||build.source_sha256!==built.report.sha256)throw new Error('源文件身份不匹配，停止自动更新');
 const source=new Map(built.words.map(w=>[w.word,w]));
 let added=0,patched=0,skippedEdited=0;
 db.exec('BEGIN IMMEDIATE');
 try{
  const before=digestLearning();
  const rows=db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(book.id);
  for(const w of rows){
   const expected=source.get(w.word);
   if(!expected||w.source_file!==spec.file||w.source_raw!==expected.source_raw||w.pos!==expected.pos||w.meaning!==expected.meaning){skippedEdited++;continue;}
   for(const fix of corrections)if(w.word===fix.word&&w.phonetic===fix.from.phonetic&&w.pos===fix.from.pos&&w.meaning===fix.from.meaning){
    patched++;if(apply)db.prepare('UPDATE words SET phonetic=? WHERE id=?').run(fix.to.phonetic,w.id);
   }
   const ex=!w.homograph&&examples[w.headword];
   if(ex&&D.normalizePartOfSpeech(w.pos)===ex.pos&&!String(w.example||'').trim()&&!String(w.example_translation||'').trim()){
    added++;if(apply)db.prepare('UPDATE words SET example=?,example_translation=? WHERE id=?').run(ex.text,ex.translation,w.id);
   }
  }
  if(apply){
   db.prepare('UPDATE vocabulary_builds SET content_version=?,audit_json=? WHERE book_id=?').run(V.VERSION,JSON.stringify(built.report),book.id);
   db.prepare('UPDATE wordbooks SET description=replace(description,?,?) WHERE id=?').run(`版本 ${build.content_version}。`,`版本 ${V.VERSION}。`,book.id);
  }
  if(digestLearning()!==before)throw new Error('学习或收藏数据发生变化，回滚');
  db.exec(apply?'COMMIT':'ROLLBACK');
  return {apply,book_id:book.id,word_count:rows.length,examples_added:added,phonetics_patched:patched,edited_rows_skipped:skippedEdited,learning_unchanged:true};
 }catch(error){db.exec('ROLLBACK');throw error;}
}
function audit(){
 const book=db.prepare('SELECT * FROM wordbooks WHERE name=? AND is_builtin=1').get(spec.name);
 const rows=db.prepare('SELECT w.*,p.first_studied FROM words w LEFT JOIN progress p ON p.word_id=w.id WHERE w.book_id=? ORDER BY w.id').all(book.id);
 const items=rows.map(w=>{const view=D.structureMeaning(w.pos,w.meaning);return {id:w.id,word:w.word,source_line:w.source_line,groups:view.meaning_groups.length,notes:view.meaning_notes.length,example:Boolean(w.example&&w.example_translation),learned:Boolean(w.first_studied),phonetic_review:/[ә?]/.test(w.phonetic),remaining_inline_ipa:view.meaning_groups.some(g=>g.items.some(item=>/\[[^\]]+\]/.test(item)))};});
 const built=V.buildBook(spec).report;
 return {version:V.VERSION,book:book.name,total:rows.length,examples:items.filter(w=>w.example).length,learned:items.filter(w=>w.learned).length,learned_with_examples:items.filter(w=>w.learned&&w.example).length,multiple_pos_entries:items.filter(w=>w.groups>1).length,entries_with_notes:items.filter(w=>w.notes).length,phonetic_symbols_to_review:items.filter(w=>w.phonetic_review).length,excluded_source_rows:built.issues,confirmed_corrections:corrections,items};
}
if(require.main===module){
 try{
  const result=improve({apply:process.argv.includes('--apply')});
  const report=audit(),dest=path.join(__dirname,`../docs/vocabulary-audit/cet6-quality-2026-10-12${result.apply?'':'-preview'}.json`);
  fs.writeFileSync(dest,JSON.stringify({operation:result,...report},null,2)+'\n');
  console.log(JSON.stringify({operation:result,...Object.fromEntries(Object.entries(report).filter(([key])=>!['items','excluded_source_rows','confirmed_corrections'].includes(key)))},null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
 finally{db.close();}
}
module.exports={improve,audit,digestLearning};
