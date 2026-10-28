'use strict';
// Incremental reviewed fields only. No reset, word-ID reassignment or book replacement.
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto'),{backup}=require('node:sqlite');
const V=require('./vocabulary'),{improve}=require('./content-maintenance'),{reviewedExample}=require('../shared/content-batch');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function candidates(db){
 const names=new Set(V.CONTENT_CATALOG.map(s=>s.name)),all=db.prepare('SELECT b.id,b.name,v.content_version,v.source_sha256,EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id) historical FROM wordbooks b LEFT JOIN vocabulary_builds v ON v.book_id=b.id WHERE b.is_builtin=1 ORDER BY b.id').all().filter(b=>names.has(b.name));
 const counts=new Map();for(const b of all)counts.set(b.name,(counts.get(b.name)||0)+1);
 const stale=all.filter(b=>!b.historical&&b.content_version!==V.VERSION),eligible=stale.filter(b=>counts.get(b.name)===1&&b.source_sha256);
 return {all,stale,eligible,skipped:stale.filter(b=>!eligible.includes(b)).map(b=>({book:b.name,reason:counts.get(b.name)!==1?'ambiguous-built-in-name':'untracked-source'}))};
}
function verifyFields(db,before,results,bookIds){
 const allowed=new Map();for(const r of results)for(const item of r.items||[]){if(!allowed.has(item.id))allowed.set(item.id,[]);allowed.get(item.id).push(item);}
 const after=db.prepare('SELECT * FROM words ORDER BY id').all();if(before.words.length!==after.length)throw Error('Content upgrade changed word identities');
 for(let i=0;i<after.length;i++)for(const key of Object.keys(before.words[i]))if(before.words[i][key]!==after[i][key]){
  const old=before.words[i],next=after[i],items=allowed.get(old.id)||[];
  const valid=key==='pos'?items.some(p=>p.field===key&&p.from===old[key]&&p.to===next[key])&&require('../shared/lexical-corrections').reviewedLexical(old)?.to.pos===next.pos:
   ['meaning','phonetic'].includes(key)?items.some(p=>p.field===key&&p.from===old[key]&&p.to===next[key]):
   ['example','example_translation'].includes(key)&&items.some(p=>p.field==='paired-example')&&!String(old.example||'').trim()&&!String(old.example_translation||'').trim()&&reviewedExample(next)?.[key==='example'?'text':'translation']===next[key];
  if(!valid)throw Error('Content upgrade changed an unapproved field');
 }
 const builds=db.prepare('SELECT * FROM vocabulary_builds ORDER BY book_id').all();if(before.builds.length!==builds.length)throw Error('Content upgrade changed build identities');
 for(let i=0;i<builds.length;i++)for(const key of Object.keys(before.builds[i]))if(before.builds[i][key]!==builds[i][key]){
  const old=before.builds[i],next=builds[i];if(!bookIds.has(old.book_id)||!['content_version','audit_json'].includes(key)||old.book_id!==next.book_id||old.source_sha256!==next.source_sha256||next.content_version!==V.VERSION)throw Error('Unexpected build metadata update');
  const book=db.prepare('SELECT name FROM wordbooks WHERE id=?').get(old.book_id),spec=V.CONTENT_CATALOG.find(s=>s.name===book.name),expected=V.buildBook(spec).report;if(next.audit_json!==JSON.stringify(expected))throw Error('Build audit differs from shipped source');
 }
 if(!same(before.sequence,db.prepare('SELECT * FROM sqlite_sequence ORDER BY name').all()))throw Error('Content upgrade changed identity sequences');
 if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Content upgrade integrity failed');
}
async function upgradeContent(db,{databasePath,backupDirectory,backupFn=backup,verify}={}){
 if(!databasePath)throw Error('A database path is required for an upgrade backup');
 const state=candidates(db);
 if(!state.stale.length)return {status:state.all.length?'up-to-date':'no-installed-content',version:V.VERSION,counts:{examples:0,meanings:0,phonetics:0},skipped:[]};
 if(!state.eligible.length)return {status:'requires-source-review',version:V.VERSION,counts:{examples:0,meanings:0,phonetics:0},skipped:state.skipped};
 const preview=improve(db,{bookIds:state.eligible.map(b=>b.id)}),matched=new Set(preview.results.filter(r=>!r.skipped).map(r=>r.book)),ids=new Set(state.eligible.filter(b=>matched.has(b.name)).map(b=>b.id));
 const skipped=[...state.skipped,...preview.results.filter(r=>r.skipped==='source-hash-mismatch').map(r=>({book:r.book,reason:r.skipped}))];
 if(!ids.size)return {status:'requires-source-review',version:V.VERSION,counts:{examples:0,meanings:0,phonetics:0},skipped};
 const folder=path.resolve(backupDirectory||path.join(path.dirname(path.resolve(databasePath)),'backups')),stamp=Date.now()+'-'+randomUUID();fs.mkdirSync(folder,{recursive:true});
 const backupFile=path.join(folder,'before-content-'+V.VERSION+'-'+stamp+'.db');await backupFn(db,backupFile);
 const before={words:db.prepare('SELECT * FROM words ORDER BY id').all(),builds:db.prepare('SELECT * FROM vocabulary_builds ORDER BY book_id').all(),sequence:db.prepare('SELECT * FROM sqlite_sequence ORDER BY name').all()};
 const result=improve(db,{apply:true,bookIds:ids,verify(context){if(verify)verify(context);verifyFields(db,before,context.results,ids);}});
 const counts=result.results.reduce((s,r)=>({examples:s.examples+(r.examples_added||0),meanings:s.meanings+(r.meanings_patched||0),phonetics:s.phonetics+(r.phonetics_patched||0)}),{examples:0,meanings:0,phonetics:0});
 const posCount=result.results.reduce((n,r)=>n+(r.parts_of_speech_patched||0),0);if(posCount)counts.parts_of_speech=posCount;
 const report={status:skipped.length?'applied-with-skips':'applied',version:V.VERSION,counts,skipped,edited_rows_preserved:result.results.reduce((n,r)=>n+(r.edited_rows_skipped||0),0),protected_state_unchanged:result.learning_and_plans_unchanged,protected_before:result.protected_before,protected_after:result.protected_after,backup:path.basename(backupFile),receipt_saved:true};
 const receipt=path.join(folder,'content-upgrade-'+V.VERSION+'-'+stamp+'.json');try{fs.writeFileSync(receipt,JSON.stringify(report,null,2)+'\n',{flag:'wx'});}catch(error){report.receipt_saved=false;report.receipt_error=error.code||'write-failed';}
 return {...report,backupFile};
}
module.exports={upgradeContent,candidates};
