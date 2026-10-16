'use strict';
// Read-only content export; workers return proposals and never modify application data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite'),V=require('../app/vocabulary');
const {current}=require('./build-gaokao-current'),{prepare,readGap}=require('./prepare-gaokao-review');
const root=path.resolve(__dirname,'..'),target=path.join(root,'docs/model-tasks-20261015');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(fs.existsSync(target))throw Error('Task snapshot already exists; do not overwrite assigned inputs');
const db=new DatabaseSync(path.join(root,'data/wordmaster.db'),{readOnly:true});
try{
 const rows=db.prepare('SELECT * FROM words ORDER BY id').all(),before=sha(JSON.stringify(rows));
 const tasks=[],files=[];
 const installed=new Map(rows.map(w=>[w.source_file+'\0'+w.source_line+'\0'+w.word,w]));
 for(const spec of V.CATALOG.filter(s=>s.file!=='zhongkao.txt')){
  const entries=V.buildBook(spec).words.map(w=>{
   const saved=installed.get(w.source_file+'\0'+w.source_line+'\0'+w.word);
   const compatible=saved&&saved.source_raw===w.source_raw&&saved.meaning===w.meaning&&saved.pos===w.pos;
   return {identity:{source_file:w.source_file,source_line:w.source_line,word:w.word,headword:w.headword,homograph:w.homograph,source_raw:w.source_raw},current:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic,example:compatible?saved.example||'':'',example_translation:compatible?saved.example_translation||'':''},task:'review-content-and-propose-original-example',installed_row_matches:!!compatible};
  });
  // Missing pairs first, but existing pairs also require review: presence is not approval.
  entries.sort((a,b)=>Number(!!a.current.example)-Number(!!b.current.example)||a.identity.source_line-b.identity.source_line);
  tasks.push({prefix:spec.file.replace('.txt',''),entries});
 }
 const scope=JSON.parse(fs.readFileSync(path.join(root,'docs/vocabulary-audit/gaokao-2025-scope.json'),'utf8'));
 const draft=prepare(scope,readGap(path.join(root,'app/seed/gaokao-gap-examples-20261013.tsv')));
 const reviewed=current().report,key=e=>e.source_entry+'\0'+e.headword,done=new Set(reviewed.entries.map(key));
 const pending=draft.items.flatMap(item=>item.learning_units.map(unit=>({...unit,source_entry:item.source_entry,pdf_page:item.pdf_page,course_level:item.course_level,handling:item.handling.type}))).filter(e=>!done.has(key(e)));
 if(pending.length!==reviewed.pending_units)throw Error('High-school pending count mismatch');
 tasks.push({prefix:'gaokao',entries:pending});
 if(before!==sha(JSON.stringify(db.prepare('SELECT * FROM words ORDER BY id').all())))throw Error('Content changed during export; retry a fresh snapshot');
 fs.mkdirSync(target);
 for(const group of tasks){
  fs.mkdirSync(path.join(target,group.prefix));
  for(let start=0;start<group.entries.length;start+=100){
   const id=group.prefix+'-'+String(start/100+1).padStart(3,'0'),entries=group.entries.slice(start,start+100);
   const data=JSON.stringify({task_id:id,status:'unassigned-proposal-only',content_version:V.VERSION,entries},null,2)+'\n';
   const relative=group.prefix+'/'+id+'.json';fs.writeFileSync(path.join(target,relative),data);
   files.push({task_id:id,file:relative,rows:entries.length,sha256:sha(data)});
  }
 }
 const numbered=db.prepare("SELECT count(*) n FROM words WHERE source_file='tem.txt' AND word IN ('bank 1','bat 1','bow 1') AND length(coalesce(example,''))>0").get().n;
 const manifest={date:'2026-10-15',operation:'read-only-unassigned-content-review-tasks',content_version:V.VERSION,groups:tasks.map(t=>({group:t.prefix,rows:t.entries.length})),files,numbered_application_probe:{rows_with_examples:numbered,application_receipt_exists:fs.existsSync(path.join(root,'docs/vocabulary-audit/numbered-examples-applied-20261015.json'))},limitations:'Proposals require main-agent validation; export is not language approval or installation. No learning, card, or plan data exported.'};
 fs.writeFileSync(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({target,groups:manifest.groups,task_files:files.length,numbered_application_probe:manifest.numbered_application_probe},null,2));
}finally{db.close();}
