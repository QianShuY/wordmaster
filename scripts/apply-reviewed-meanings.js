'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync,backup}=require('node:sqlite'),{improve}=require('./content-quality');
async function main(){
 const root=path.resolve(__dirname,'..'),apply=process.argv.includes('--apply');
 const selections=[{flag:'--deferred',id:'deferred-meanings',file:'meanings-deferred-reviewed-20261014.json',date:'2026-10-14'},...['g','h','i'].map(id=>({flag:'--'+id,id:id+'-meanings',file:'meanings-'+id+'-reviewed-20261015.json',date:'2026-10-15'}))];
 const flags=new Set(['--apply',...selections.map(s=>s.flag)]);for(const arg of process.argv.slice(2))if(!flags.has(arg))throw Error('Unknown meaning maintenance argument: '+arg);
 const requested=selections.filter(s=>process.argv.includes(s.flag));if(requested.length>1)throw Error('Choose one reviewed meaning allowlist');
 const selected=requested[0]||{id:'meanings',file:'meanings-reviewed-20261014.json',date:'2026-10-14'},patches=require('../app/seed/'+selected.file);
 const db=new DatabaseSync(path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db')),{readOnly:!apply});
 db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
 try{
  const allowed=new Map(patches.map(p=>[p.source_file+'\0'+p.word,p])),dry=improve(db);
  for(const r of dry.results)for(const item of r.items||[]){const w=db.prepare('SELECT * FROM words WHERE id=?').get(item.id);if(!allowed.has(w.source_file+'\0'+w.word)||!['meaning','paired-example'].includes(item.field))throw new Error('Preview exceeds reviewed meaning corrections');}
  if(!apply){console.log(JSON.stringify({apply:false,results:dry.results.map(({items,...r})=>r)},null,2));return;}
  if(!dry.results.some(r=>r.meanings_patched||r.examples_added)){console.log(JSON.stringify({meanings:0,example_pairs:0,protected_state_unchanged:true,existing_application_report_preserved:true}));return;}
  const folder=path.join(root,'output/refinement');fs.mkdirSync(folder,{recursive:true});const backupFile=path.join(folder,'before-reviewed-meanings-'+Date.now()+'.db');await backup(db,backupFile);
  const before=db.prepare('SELECT * FROM words ORDER BY id').all(),changes=[];
  const applied=improve(db,{apply:true,verify(){
   const after=db.prepare('SELECT * FROM words ORDER BY id').all();if(before.length!==after.length)throw new Error('Word identities changed');
   for(let i=0;i<before.length;i++)for(const field of Object.keys(before[i]))if(before[i][field]!==after[i][field]){
    const p=allowed.get(before[i].source_file+'\0'+before[i].word);
    const valid=p&&(field==='meaning'?before[i].meaning===p.from.meaning&&after[i].meaning===p.to.meaning:
     ['example','example_translation'].includes(field)&&!before[i][field]&&after[i][field]===p.example[field==='example'?'text':'translation']);
    if(!valid)throw new Error('Unexpected field change; transaction rolled back');
    changes.push({id:before[i].id,source_file:before[i].source_file,word:before[i].word,field,from:before[i][field],to:after[i][field]});
   }
   if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Integrity failed');
  }});
  const report={date:selected.date,backup:backupFile,protected_state_unchanged:applied.learning_and_plans_unchanged,version:applied.version,changes};
  fs.writeFileSync(path.join(root,'docs/vocabulary-audit/'+selected.id+'-applied-'+selected.date.replaceAll('-','')+'.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({meanings:changes.filter(x=>x.field==='meaning').length,example_pairs:changes.filter(x=>x.field==='example').length,protected_state_unchanged:report.protected_state_unchanged}));
 }finally{db.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
