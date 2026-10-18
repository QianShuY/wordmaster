'use strict';
/**
 * Real sentence pairs for distinct numbered homographs.
 * The numeric suffix is a source-only disambiguator, never learner English.
 * Source SHA, record ID, previous example and unapproved status are all bound.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..');
const FILES=['docs/model-quality-patches/manual-natural-cet6-numbered-94-20261018.json',
 'docs/model-quality-patches/manual-natural-tem-matched-numbered-33-20261018.json',
 'docs/model-quality-patches/tem-numbered-natural-early-83.json',
 'docs/model-quality-patches/tem-numbered-natural-late-64.json'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fromInput=e=>e.identity??Object.fromEntries(['source_entry','headword','pdf_page','handling','accepted_spellings'].map(k=>[k,e[k]]));
function run(root=ROOT,{apply=false}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const metas=new Map(manifest.files.map(x=>[x.task_id,x]));
 const changes=[],groups=new Map(),unique=new Set(),expectedCount=274;
 for(const file of FILES){
  const bundle=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if(bundle.approved!==false||!Array.isArray(bundle.entries))throw Error('Invalid review-only bundle');
  for(const p of bundle.entries){
   const key=p.task_id+':'+p.row_index;
   if(unique.has(key)||p.worker!==ownerOf(p.task_id))throw Error('Duplicate/misassigned '+key);
   unique.add(key);
   if(!/ [1-9]\d*$/.test(p.word)||!Number.isInteger(p.row_index)||p.row_index<0)
    throw Error('Invalid numbered headword '+key);
   const base=p.word.replace(/ [1-9]\d*$/,'');
   if(!p.example?.toLowerCase().includes(base.toLowerCase())||p.example.toLowerCase().includes(p.word.toLowerCase())
      ||!p.translation||!/[一-鿿]/.test(p.translation))
    throw Error('Incorrect contextual example '+key);
   if(!groups.has(p.task_id))groups.set(p.task_id,[]);
   groups.get(p.task_id).push(p);
  }
 }
 if(unique.size!==expectedCount)throw Error('Unexpected numbered patch count '+unique.size);
 let edited=0,already=0;
 for(const [task,rows] of groups){
  const m=metas.get(task),worker=ownerOf(task);
  if(!m)throw Error('Unrecognized source task '+task);
  const bytes=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',m.file));
  if(sha(bytes)!==m.sha256)throw Error('Frozen source modified '+task);
  const original=JSON.parse(bytes);
  const target=path.join(root,'docs/model-task-results','worker-'+worker,task,'result.json');
  const d=JSON.parse(fs.readFileSync(target,'utf8'));
  if(d.task_id!==task||d.input_sha256!==m.sha256||d.entries.length!==m.rows)
   throw Error('Proposal identity mismatch '+task);
  let changed=false;
  for(const p of rows){
   const s=original.entries[p.row_index],e=d.entries[p.row_index],key=task+':'+p.row_index;
   if(!s||!e||!isDeepStrictEqual(e.identity,fromInput(s))
    ||!isDeepStrictEqual(e.original,s.current??null)
    ||(e.identity.word||e.identity.headword)!==p.word)
    throw Error('Original source identity drift '+key);
   if(e.verification!=='needs-review'||e.external_human_review===true
      ||e.full_dictionary_senses_reviewed===true)throw Error('Previously approved '+key);
   const prev=e.proposed.example===p.old_example&&e.draft_method==='offline-context-first-draft';
   const next=e.proposed.example===p.example
      &&e.proposed.example_translation===p.translation
      &&e.draft_method==='editorial-context-rewrite-needs-review';
   if(!prev&&!next)throw Error('Unexpected existing example modification '+key);
   if(next){already++;continue}
   e.proposed.example=p.example;
   e.proposed.example_translation=p.translation;
   e.draft_method='editorial-context-rewrite-needs-review';
   if(!Array.isArray(e.issues))throw Error('Malformed issue history '+key);
   e.issues.push('同形异义词编号仅用于来源检索，已用实际语义例句替换，仍需独立审校。');
   e.issues.push(p.review_note);
   e.change_reason='修正带编号的同形异义例句；原词表、词性、音标、学习数据保持不变。';
   changed=true;edited++;
  }
  if(changed)changes.push({target,contents:JSON.stringify(d,null,2)+'\n'});
 }
 if(edited+already!==expectedCount)throw Error('Not all edits accounted');
 if(apply)for(const w of changes)fs.writeFileSync(w.target,w.contents);
 return {review_only:true,edited,already,all:expectedCount,changed_files:changes.length,
  applied:apply,accepted:0,installed:0,student_data_touched:false};
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.some(x=>x!=='--apply'))throw Error('Unknown flag');
 console.log(JSON.stringify(run(ROOT,{apply:args.includes('--apply')}),null,2));
}
module.exports={run};
