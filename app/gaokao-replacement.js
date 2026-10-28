'use strict';
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto'),{backup}=require('node:sqlite');
const V=require('./vocabulary');
const quote=s=>'"'+s.replaceAll('"','""')+'"';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function snapshot(db){
 return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({name})=>({name,rows:db.prepare(`SELECT rowid AS __rowid,* FROM ${quote(name)} ORDER BY rowid`).all()}));
}
function verifyPreserved(db,before,newId,oldIds){
 const additive=new Set(['words','wordbooks','vocabulary_builds','word_answer_policies','book_history']);
 for(const table of before){
  const rows=db.prepare(`SELECT rowid AS __rowid,* FROM ${quote(table.name)} ORDER BY rowid`).all();
  const index=new Map(rows.map(row=>[row.__rowid,row]));
  for(const row of table.rows)if(!same(row,index.get(row.__rowid)))throw Error('Replacement changed existing '+table.name+' row');
  if(!additive.has(table.name)&&!same(rows,table.rows))throw Error('Replacement changed protected '+table.name);
  const old=new Set(table.rows.map(row=>row.__rowid));
  for(const row of rows.filter(row=>!old.has(row.__rowid))){
   const valid=table.name==='wordbooks'?row.id===newId:
    table.name==='words'||table.name==='vocabulary_builds'?row.book_id===newId:
    table.name==='word_answer_policies'?db.prepare('SELECT book_id FROM words WHERE id=?').get(row.word_id)?.book_id===newId:
    table.name==='book_history'?oldIds.includes(row.book_id)&&row.replacement_book_id===newId:false;
   if(!valid)throw Error('Unexpected replacement row in '+table.name);
  }
 }
 if(db.prepare('PRAGMA foreign_key_check').all().length||db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Replacement integrity failed');
}
async function replaceZhongkao(db,{databasePath,backupDirectory,backupFn=backup,install,verify}={}){
 const pending=()=>db.prepare("SELECT b.* FROM wordbooks b WHERE b.name='中考核心词汇' AND b.is_builtin=1 AND NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id) ORDER BY b.id").all();
 if(!pending().length)return {status:'up-to-date',historyBooks:0};
 if(!databasePath||typeof install!=='function')throw Error('Replacement requires a database backup path and installer');
 const folder=path.resolve(backupDirectory||path.join(path.dirname(path.resolve(databasePath)),'backups'));
 fs.mkdirSync(folder,{recursive:true});
 const stamp=Date.now()+'-'+randomUUID(),backupFile=path.join(folder,'before-gaokao-'+stamp+'.db');
 await backupFn(db,backupFile);
 let result;
 db.exec('BEGIN IMMEDIATE');
 try{
  const old=pending();
  if(!old.length){db.exec('ROLLBACK');return {status:'up-to-date',historyBooks:0};}
  const before=snapshot(db),existing=db.prepare('SELECT b.*,v.source_sha256 FROM wordbooks b LEFT JOIN vocabulary_builds v ON v.book_id=b.id WHERE b.name=? AND b.is_builtin=1').all(V.GAOKAO.name);
  const built=V.buildBook(V.GAOKAO);
  if(existing.length>1||existing.length===1&&(existing[0].source_sha256!==built.report.sha256||db.prepare('SELECT 1 FROM book_history WHERE book_id=?').get(existing[0].id)))throw Error('Ambiguous Gaokao installation; original books retained');
  const id=existing[0]?.id||Number(db.prepare('INSERT INTO wordbooks(name,is_builtin,plan_active) VALUES(?,1,0)').run(V.GAOKAO.name).lastInsertRowid);
  if(!existing.length)install(id,V.GAOKAO);
  for(const book of old)db.prepare('INSERT INTO book_history(book_id,replacement_book_id,reason_json,original_plan_json) VALUES(?,?,?,?)').run(book.id,id,JSON.stringify(['gaokao-preview-replacement','preserve-all-original-rows']),JSON.stringify(book));
  if(verify)verify({db,newBookId:id});
  verifyPreserved(db,before,id,old.map(b=>b.id));
  db.exec('COMMIT');
  result={status:'applied',historyBooks:old.length,historicalBookIds:old.map(b=>b.id),newBookId:id,words:built.words.length,
   newBookCreated:!existing.length,existingRowsPreserved:true,progressCopied:false,planCopied:false,backupFile,receiptSaved:true};
 }catch(error){db.exec('ROLLBACK');throw error;}
 try{fs.writeFileSync(path.join(folder,'gaokao-replacement-'+stamp+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}catch{result.receiptSaved=false;}
 return result;
}
module.exports={replaceZhongkao,snapshot,verifyPreserved};
