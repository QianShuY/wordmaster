'use strict';
// Read-only inventory and always-rolled-back rehearsal. Never an install command.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {DatabaseSync,backup}=require('node:sqlite');
const {createHash}=require('node:crypto');
const V=require('../app/vocabulary');
const {reviewedExample}=require('../shared/content-batch');
const Policy=require('../shared/answer-policy');
const {contentHash}=require('../app/vocabulary-history');
const quote=s=>'"'+s.replaceAll('"','""')+'"';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function tables(db){return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x=>x.name);}
function fingerprint(db){return hash(tables(db).map(name=>[name,db.prepare(`SELECT * FROM ${quote(name)} ORDER BY rowid`).all()]));}
function preview(db){
 const spec=V.CATALOG.find(x=>x.file==='zhongkao.txt'),built=V.buildBook(spec);
 const old=db.prepare('SELECT * FROM wordbooks WHERE name=? AND is_builtin=1').all(spec.name);
 if(old.length!==1)throw new Error('Expected one original built-in Zhongkao book');
 const book=old[0],rows=db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(book.id);
 const expected=new Map(built.words.map(x=>[x.word,x])),examples=require('../app/seed/reviewed-examples.json');
 const edited=rows.filter(row=>{
  const e=expected.get(row.word);if(!e)return true;
  if(['headword','homograph','source_file','source_line','source_raw','phonetic','pos','meaning'].some(k=>(row[k]??null)!==(e[k]??null)))return true;
  const ex=e.reviewed_example||reviewedExample(e)||examples[e.headword];
  // Empty examples may be an older installation. Non-empty unknown text is user content.
  return Boolean(row.example&&row.example!==ex?.text||row.example_translation&&row.example_translation!==ex?.translation);
 }).map(x=>x.id);
 const references=[];
 for(const name of tables(db)){
  if(['words','vocabulary_builds'].includes(name))continue;
  const cols=db.prepare(`PRAGMA table_info(${quote(name)})`).all();
  const fks=db.prepare(`PRAGMA foreign_key_list(${quote(name)})`).all();
  const wordCols=new Set(cols.filter(x=>x.name==='word_id').map(x=>x.name));
  const bookCols=new Set(cols.filter(x=>x.name==='book_id').map(x=>x.name));
  for(const fk of fks){if(fk.table==='words')wordCols.add(fk.from);if(fk.table==='wordbooks')bookCols.add(fk.from);}
  for(const col of wordCols){const n=db.prepare(`SELECT COUNT(*) n FROM ${quote(name)} WHERE ${quote(col)} IN (SELECT id FROM words WHERE book_id=?)`).get(book.id).n;if(n)references.push({table:name,column:col,rows:n});}
  for(const col of bookCols){const n=db.prepare(`SELECT COUNT(*) n FROM ${quote(name)} WHERE ${quote(col)}=?`).get(book.id).n;if(n)references.push({table:name,column:col,rows:n});}
 }
 // Battle pools contain frozen word IDs in JSON. Preserve all old content when
 // any persisted battle exists; guessing which JSON fields matter is unsafe.
 if(tables(db).includes('boss_sessions')){const n=db.prepare('SELECT COUNT(*) n FROM boss_sessions').get().n;if(n)references.push({table:'boss_sessions',column:'pool_json (conservative)',rows:n});}
 const active=Boolean(book.plan_active),keep=active||edited.length>0||references.length>0;
 return {operation:'read-only-replacement-preview',old_book_id:book.id,old_word_count:rows.length,
  old_content_sha256:hash(rows),old_plan:{active,daily_new:book.daily_new,daily_review:book.daily_review,mode:book.plan_mode,target_date:book.target_date},
  edited_word_ids:edited,references,old_book_action:keep?'retain-history-readonly':'remove-unreferenced-built-in',
  history_reasons:[active?'active-plan':null,edited.length?'edited-or-custom-content':null,references.length?'persisted-references':null].filter(Boolean),
  new_book_policy:'independent-id-no-progress-copy-no-plan-copy',
  checkpoint_policy:keep?'preserve-old-checkpoint-as-history; never resume it against the new book':'remove-only-old-book-checkpoint; preserve all other books and database identity',
  replacement_ready:false,blockers:['Full reviewed Gaokao package not available','Declared source count and usage evidence remain unresolved','Production migration remains gated on complete reviewed content; history and spelling paths are now implemented']};
}
function rehearse(db,batch,{afterInsert,afterTransition}={}){
 if(batch.status!=='selected-sense-reviewed-not-installed'||!Array.isArray(batch.entries)||batch.entries.length!==batch.entries_count||!batch.entries.length)throw new Error('Expected a reviewed selected-sense rehearsal batch');
 const before=fingerprint(db);let result;
 db.exec('BEGIN IMMEDIATE');
 try{
  const plan=preview(db),id=Number(db.prepare("INSERT INTO wordbooks(name,description,is_builtin,plan_active) VALUES('高考核心词汇（隔离预演）','subset rehearsal only',1,0)").run().lastInsertRowid);
  const insert=db.prepare('INSERT INTO words(book_id,word,headword,pos,meaning,phonetic,example,example_translation,source_file,source_line,source_raw) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  // These real tables exist in schema 12. A schema 11 copy can rehearse their
  // creation within the same always-rolled-back transaction.
  db.exec(`CREATE TABLE IF NOT EXISTS book_history(book_id INTEGER PRIMARY KEY REFERENCES wordbooks(id),replacement_book_id INTEGER NOT NULL REFERENCES wordbooks(id),reason_json TEXT NOT NULL,original_plan_json TEXT NOT NULL,archived_at TEXT NOT NULL DEFAULT(datetime('now','localtime')));
   CREATE TABLE IF NOT EXISTS word_answer_policies(word_id INTEGER PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE,policy_json TEXT NOT NULL,content_sha256 TEXT NOT NULL);`);
  for(const e of batch.entries){
   if(e.review_status!=='selected-sense-reviewed-not-installed'||!e.phonetic||!e.example||!e.example_translation||!e.meaning)throw new Error('Unreviewed rehearsal entry');
   const policy=Policy.create(e.headword,e.accepted_spellings,e.answer_policy?.rejected||[]);
   if(hash(policy)!==hash(e.answer_policy))throw new Error('Answer policy differs from reviewed spellings');
   const wordId=Number(insert.run(id,e.headword,e.headword,e.pos,e.meaning,e.phonetic,e.example,e.example_translation,'gaokao-2025-scope',e.pdf_page,e.source_entry).lastInsertRowid);
   const row=db.prepare('SELECT * FROM words WHERE id=?').get(wordId);
   db.prepare('INSERT INTO word_answer_policies VALUES(?,?,?)').run(wordId,JSON.stringify(policy),contentHash(row));
  }
  if(afterInsert)afterInsert(db,id);
  if(plan.old_book_action==='retain-history-readonly'){
   const original=db.prepare('SELECT * FROM wordbooks WHERE id=?').get(plan.old_book_id);
   db.prepare('INSERT INTO book_history(book_id,replacement_book_id,reason_json,original_plan_json) VALUES(?,?,?,?)').run(plan.old_book_id,id,JSON.stringify(plan.history_reasons),JSON.stringify(original));
  }else db.prepare('DELETE FROM wordbooks WHERE id=?').run(plan.old_book_id);
  if(afterTransition)afterTransition(db,id);
  if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Rehearsal reference integrity failed');
  if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Rehearsal database integrity failed');
  result={operation:'subset-transaction-rehearsal-always-rollback',production_ready:false,installed_in_production:false,
   old_book_action:plan.old_book_action,old_book_id:plan.old_book_id,new_book_id:id,subset_words:batch.entries.length,
   new_progress_rows:db.prepare('SELECT COUNT(*) n FROM progress WHERE word_id IN (SELECT id FROM words WHERE book_id=?)').get(id).n,
   new_plan_active:db.prepare('SELECT plan_active FROM wordbooks WHERE id=?').get(id).plan_active,
   old_book_remaining:Boolean(db.prepare('SELECT 1 FROM wordbooks WHERE id=?').get(plan.old_book_id))};
 }finally{db.exec('ROLLBACK');}
 if(fingerprint(db)!==before)throw new Error('Rehearsal rollback changed existing rows');
 return {...result,all_existing_rows_restored:true};
}
async function main(){
 const root=path.join(__dirname,'..'),sourcePath=path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db'));
 const source=new DatabaseSync(sourcePath,{readOnly:true});let report;
 try{
  source.exec('BEGIN');try{report=preview(source);}finally{source.exec('ROLLBACK');}
  if(process.argv.includes('--rehearse')){
   const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-gaokao-rehearsal-')),copyPath=path.join(dir,'copy.db');
   let copy;
   try{
    await backup(source,copyPath);
    copy=new DatabaseSync(copyPath);copy.exec('PRAGMA foreign_keys=ON');
    const reviewed=JSON.parse(fs.readFileSync(path.join(root,'docs/vocabulary-audit/gaokao-reviewed-units-current.json'),'utf8'));
    const batch={status:'selected-sense-reviewed-not-installed',entries_count:reviewed.entries.length,entries:reviewed.entries};
    report.rehearsal=rehearse(copy,batch);
   }finally{copy?.close();fs.rmSync(dir,{recursive:true,force:true});}
  }
 }finally{source.close();}
 const executionDate=new Date().toISOString().slice(0,10);report.execution_date=executionDate;
 fs.writeFileSync(path.join(root,`docs/vocabulary-audit/gaokao-replacement-preview-${executionDate}.json`),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={preview,rehearse,fingerprint};
