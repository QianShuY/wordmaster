'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync,backup}=require('node:sqlite');
const {improve}=require('./content-quality'),patches=require('../app/seed/phonetics-missing-reviewed-20261014.json');
async function main(){
 const root=path.resolve(__dirname,'..'),apply=process.argv.includes('--apply');
 const db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),{readOnly:!apply});
 try{
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
  const allowed=new Map(patches.map(p=>[p.source_file+'\0'+p.source_line+'\0'+p.word,p])),dry=improve(db);
  for(const r of dry.results)for(const item of r.items||[]){
   const w=db.prepare('SELECT * FROM words WHERE id=?').get(item.id),p=allowed.get(w.source_file+'\0'+w.source_line+'\0'+w.word);
   if(!p||!['phonetic','meaning'].includes(item.field))throw new Error('Preview exceeds missing-IPA allowlist');
  }
  if(!apply){console.log(JSON.stringify({apply:false,results:dry.results.map(({items,...r})=>r)},null,2));return;}
  const folder=path.join(root,'output/refinement');fs.mkdirSync(folder,{recursive:true});
  const backupFile=path.join(folder,'before-missing-phonetics-'+Date.now()+'.db');await backup(db,backupFile);
  const before=db.prepare('SELECT * FROM words ORDER BY id').all(),changes=[];
  const applied=improve(db,{apply:true,verify(){
   const after=db.prepare('SELECT * FROM words ORDER BY id').all();if(before.length!==after.length)throw new Error('Word count changed');
   for(let i=0;i<before.length;i++)for(const field of Object.keys(before[i]))if(before[i][field]!==after[i][field]){
    const w=before[i],p=allowed.get(w.source_file+'\0'+w.source_line+'\0'+w.word);
    if(!p||!['phonetic','meaning'].includes(field)||w[field]!==p.from[field]||after[i][field]!==p.to[field])throw new Error('Unexpected content change');
    changes.push({id:w.id,word:w.word,source_file:w.source_file,field,from:w[field],to:after[i][field]});
   }
   if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Integrity failed');
  }});
  const report={date:'2026-10-14',backup:backupFile,version:applied.version,protected_state_unchanged:applied.learning_and_plans_unchanged,changes};
  fs.writeFileSync(path.join(root,'docs/vocabulary-audit/missing-phonetics-applied-20261014.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({phonetics:changes.filter(x=>x.field==='phonetic').length,meanings:changes.filter(x=>x.field==='meaning').length,protected_state_unchanged:report.protected_state_unchanged}));
 }finally{db.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
