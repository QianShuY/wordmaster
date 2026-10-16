'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync,backup}=require('node:sqlite'),{improve}=require('./content-quality'),{reviewedSymbol}=require('../shared/phonetic-symbols');
async function main(){
 const root=path.resolve(__dirname,'..'),apply=process.argv.includes('--apply'),db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),{readOnly:!apply});
 const dictionary=process.argv.includes('--dictionary'),patches=dictionary?require('../app/seed/phonetics-private-use-20261015.json'):null;
 const reviewed=word=>dictionary?patches.find(p=>p===require('../shared/content-batch').reviewedPhonetic(word)):reviewedSymbol(word);
 db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
 try{
  const before=db.prepare('SELECT * FROM words ORDER BY id').all(),byId=new Map(before.map(w=>[w.id,w])),dry=improve(db);
  for(const r of dry.results)for(const item of r.items||[])if(item.field!=='phonetic'||!reviewed(byId.get(item.id)))throw Error('Preview exceeds exact phonetic-only allowlist');
  const planned=dry.results.reduce((n,r)=>n+(r.phonetics_patched||0),0);
  if(!apply){console.log(JSON.stringify({apply:false,planned,protected_state_unchanged:dry.learning_and_plans_unchanged}));return;}
  const folder=path.join(root,'output/refinement');fs.mkdirSync(folder,{recursive:true});const backupFile=path.join(folder,'before-phonetic-symbols-'+Date.now()+'.db');await backup(db,backupFile);
  const changes=[];const result=improve(db,{apply:true,verify(){
   const after=db.prepare('SELECT * FROM words ORDER BY id').all();if(before.length!==after.length)throw Error('Word identities changed');
   for(let i=0;i<before.length;i++)for(const field of Object.keys(before[i]))if(before[i][field]!==after[i][field]){const p=reviewed(before[i]);if(field!=='phonetic'||!p||after[i][field]!==p.to.phonetic)throw Error('Unexpected field change');changes.push({id:before[i].id,word:before[i].word,from:before[i][field],to:after[i][field]});}
   if(changes.length!==planned||db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Verification failed');
  }});
  const report={date:'2026-10-15',version:result.version,operation:dictionary?'exact-source-primary-pos-pronunciation':'exact-source-symbol-only-normalization',backup:backupFile,protected_state_unchanged:result.learning_and_plans_unchanged,full_pronunciation_reviewed:false,changes};
  fs.writeFileSync(path.join(root,'docs/vocabulary-audit/'+(dictionary?'phonetics-private-use':'phonetic-symbols')+'-applied-20261015.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({applied:changes.length,protected_state_unchanged:report.protected_state_unchanged}));
 }finally{db.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
