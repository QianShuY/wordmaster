'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const V=require('../app/vocabulary');
const spec=V.CATALOG.find(x=>x.file==='cet6.txt');
const fixes=require('../app/seed/cet6-recovered.json');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function snapshot(db,ids,targetBook){
 const data={};
 for(const {name} of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('words','wordbooks','vocabulary_builds','sqlite_sequence') ORDER BY name").all())
  data[name]=db.prepare(`SELECT * FROM "${name.replaceAll('"','""')}" ORDER BY rowid`).all();
 const allowed=new Set(ids);
 data.existing_words=db.prepare('SELECT * FROM words ORDER BY id').all().filter(w=>allowed.has(w.id));
 data.books=db.prepare('SELECT * FROM wordbooks ORDER BY id').all().map(b=>{const copy={...b};if(b.id===targetBook)delete copy.description;return copy;});
 return hash(data);
}
function recover(db,{apply=false}={}){
 db.exec(apply?'BEGIN IMMEDIATE':'BEGIN');
 try{
  const book=db.prepare('SELECT * FROM wordbooks WHERE name=? AND is_builtin=1').get(spec.name);
  if(!book)throw Error('Missing built-in CET6 book');
  const built=V.buildBook(spec),version=db.prepare('SELECT * FROM vocabulary_builds WHERE book_id=?').get(book.id);
  if(version?.source_sha256!==built.report.sha256)throw Error('Source hash differs: no recovery');
  const old=db.prepare('SELECT id FROM words ORDER BY id').all().map(w=>w.id),before=snapshot(db,old,book.id);
  const rows=built.words.filter(w=>fixes.some(f=>f.source_raw===w.source_raw&&f.source_line===w.source_line));
  const added=[],skipped=[];
  for(const word of rows){
   // Any existing headword identity collision must not be overwritten or relabelled.
   const existing=db.prepare('SELECT * FROM words WHERE book_id=? AND word=?').get(book.id,word.word);
   if(existing){
    const same=existing.source_file===spec.file&&existing.source_raw===word.source_raw&&existing.source_line===word.source_line&&existing.pos===word.pos&&existing.meaning===word.meaning&&existing.phonetic===word.phonetic;
    skipped.push({word:word.word,reason:same?'already-recovered':'existing-content-preserved'});continue;
   }
   const fix=fixes.find(f=>f.source_raw===word.source_raw&&f.source_line===word.source_line);
   added.push({word:word.word,headword:word.headword,pos:word.pos,phonetic:word.phonetic,source_line:word.source_line,source:fix.source});
   if(apply)db.prepare(`INSERT INTO words(book_id,word,phonetic,pos,meaning,headword,homograph,source_file,source_line,source_raw,example,example_translation)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(book.id,word.word,word.phonetic,word.pos,word.meaning,word.headword,word.homograph,spec.file,word.source_line,word.source_raw,word.reviewed_example.text,word.reviewed_example.translation);
  }
  const after=snapshot(db,old,book.id);
  if(before!==after)throw Error('Existing vocabulary or learning changed: rollback');
  if(apply){
   db.prepare('UPDATE vocabulary_builds SET content_version=?,audit_json=? WHERE book_id=?').run(V.VERSION,JSON.stringify(built.report),book.id);
   // Only rewrite the machine-generated summary, never a custom description.
   if(/^六级词表 · 收录 \d+ 条经结构校验的源词条；待核验 \d+ 行。版本 [\d.-]+。不等同官方完整考纲。$/.test(book.description)){
    const count=db.prepare('SELECT count(*) n FROM words WHERE book_id=?').get(book.id).n;
    db.prepare('UPDATE wordbooks SET description=? WHERE id=?').run(`${spec.label} · 收录 ${count} 条经结构校验的源词条；待核验 ${built.report.excluded} 行。版本 ${V.VERSION}。不等同官方完整考纲。`,book.id);
   }
  }
  db.exec(apply?'COMMIT':'ROLLBACK');
  return {date:'2026-10-13',apply,version:V.VERSION,added,skipped,source_rows_reviewed:fixes.length,source_duplicates_merged:1,remaining_excluded:built.report.excluded,
   protected_before:before,protected_after:after,existing_words_and_learning_unchanged:true};
 }catch(e){db.exec('ROLLBACK');throw e;}
}
if(require.main===module){
 const apply=process.argv.includes('--apply');
 const db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(__dirname,'../data/wordmaster.db')),{readOnly:!apply});
 db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
 try{const result=recover(db,{apply});fs.writeFileSync(path.join(__dirname,`../docs/vocabulary-audit/cet6-recovery-2026-10-13${apply?'':'-preview'}.json`),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));}finally{db.close();}
}
module.exports={recover,snapshot};
