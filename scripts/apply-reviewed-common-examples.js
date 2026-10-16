'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync,backup}=require('node:sqlite');
const {improve,inventory}=require('./content-quality');
async function main(){
 const root=path.resolve(__dirname,'..'),apply=process.argv.includes('--apply');
 const selections=[{flag:'--numbered',id:'numbered',file:'examples-numbered-reviewed-20261015.json',date:'2026-10-15'},{flag:'--extended',id:'extended',file:'examples-extended-reviewed-20261014.json',date:'2026-10-14'},...['d','e','f','g','h','i'].map(id=>({flag:'--common-'+id,id:'common-'+id,date:['d','e','f'].includes(id)?'2026-10-14':'2026-10-15',file:'examples-common-'+id+'-reviewed-'+(['d','e','f'].includes(id)?'20261014':'20261015')+'.json'}))];
 const flags=new Set(['--apply',...selections.map(s=>s.flag)]);for(const arg of process.argv.slice(2))if(!flags.has(arg))throw Error('Unknown example maintenance argument: '+arg);
 const requested=selections.filter(s=>process.argv.includes(s.flag));if(requested.length>1)throw Error('Choose one reviewed example allowlist');
 const selected=requested[0]||{id:'common',file:'examples-common-a-reviewed-20261014.json',date:'2026-10-14'};
 const batch=require('../app/seed/'+selected.file);
 const file=path.resolve(process.env.WORDMASTER_DB_PATH||path.join(root,'data/wordmaster.db'));
 const db=new DatabaseSync(file,{readOnly:!apply});db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
 try{
  const allowed=new Map(batch.examples.map(e=>[e.source_file+'\0'+e.word,e]));
  const dry=improve(db);
  for(const book of dry.results)for(const item of book.items||[]){
   const word=db.prepare('SELECT * FROM words WHERE id=?').get(item.id);
   if(item.field!=='paired-example'||!allowed.has(word.source_file+'\0'+word.word))throw new Error('Preview exceeds the reviewed example allowlist');
  }
  const preview=dry.results.map(({items,...book})=>book);
  if(!apply){console.log(JSON.stringify({apply:false,preview},null,2));return;}
  if(!dry.results.some(r=>r.examples_added)){console.log(JSON.stringify({apply:true,added:0,protected_state_unchanged:true,existing_application_report_preserved:true}));return;}
  const folder=path.join(root,'output/refinement');fs.mkdirSync(folder,{recursive:true});
  const backupFile=path.join(folder,'before-common-examples-'+Date.now()+'.db');await backup(db,backupFile);
  let changes=[];
  const before=db.prepare('SELECT * FROM words ORDER BY id').all();
  const result=improve(db,{apply:true,verify(){
   const after=db.prepare('SELECT * FROM words ORDER BY id').all();
   if(before.length!==after.length)throw new Error('Word identities changed');
   for(let i=0;i<before.length;i++)for(const field of Object.keys(before[i]))if(before[i][field]!==after[i][field]){
    const expected=allowed.get(before[i].source_file+'\0'+before[i].word);
    if(!expected||!['example','example_translation'].includes(field)||before[i][field]||after[i][field]!==expected[field==='example'?'text':'translation'])throw new Error('Unreviewed field change; transaction cancelled');
    changes.push({id:before[i].id,word:before[i].word,source_file:before[i].source_file,field});
   }
   if(db.prepare('PRAGMA foreign_key_check').all().length||db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Content integrity failed');
  }});
  const full=inventory(db),report={date:selected.date,backup:backupFile,version:result.version,protected_state_unchanged:result.learning_and_plans_unchanged,
   reviewed_bindings:batch.examples.length,deferred_bindings:batch.deferred.length,changed_fields:changes,results:result.results,
   books:full.books.map(({items,excluded,...book})=>book)};
  fs.writeFileSync(path.join(root,`docs/vocabulary-audit/${selected.id}-examples-applied-${selected.date.replaceAll('-','')}.json`),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({apply:true,added:changes.length/2,protected_state_unchanged:report.protected_state_unchanged,books:report.books},null,2));
 }finally{db.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
