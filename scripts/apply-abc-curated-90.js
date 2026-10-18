'use strict';
/**
 * Move 90 hand-written and meaning-specific context examples into their
 * draft proposal files. Requires unchanged source identity, hashes and
 * original bilingual placeholders. No dictionaries or student data written.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..');
const FILES=[
 'docs/model-quality-patches/curated-cet4-044-20261018.json',
 'docs/model-quality-patches/curated-cet6-046-20261018.json'
];
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
const sourceId=e=>e.identity??Object.fromEntries(['source_entry','headword','pdf_page','handling','accepted_spellings'].map(k=>[k,e[k]]));
function run(root=ROOT,{apply=false}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const byId=new Map(manifest.files.map(m=>[m.task_id,m]));
 const rows=FILES.flatMap(file=>{
  const x=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if(x.approved!==false||!Array.isArray(x.entries))throw Error('Not an unapproved editorial patch: '+file);
  return x.entries;
 });
 if(rows.length!==90)throw Error('Expected 90 authored replacements');
 const groups=new Map(),seen=new Set();
 for(const r of rows){
  const key=r.task_id+':'+r.row_index;
  if(seen.has(key))throw Error('Duplicate '+key);
  seen.add(key);
  if(ownerOf(r.task_id)!==r.worker||!Number.isInteger(r.row_index)||r.row_index<0
   ||!r.example?.trim()||!r.translation?.trim()||!/[一-鿿]/.test(r.translation))
   throw Error('Incomplete or invalid patch '+key);
  if(!r.example.toLowerCase().includes(r.word.toLowerCase()))throw Error('Missing learner headword '+key);
  if(!groups.has(r.task_id))groups.set(r.task_id,[]);
  groups.get(r.task_id).push(r);
 }
 const writes=[],summary={total:90,edited:0,already:0,
  modified_files:0,remaining_mechanical_in_target_tasks:0,
  accepted:0,installed:0,student_database_modified:false,
  tasks:[]};
 for(const [task,edits] of groups){
  const m=byId.get(task);
  if(!m)throw Error('Unrecognized task '+task);
  const bytes=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',m.file));
  if(digest(bytes)!==m.sha256)throw Error('Frozen source changed '+task);
  const input=JSON.parse(bytes);
  const filename=path.join(root,'docs/model-task-results','worker-'+ownerOf(task),task,'result.json');
  const proposal=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(proposal.task_id!==task||proposal.input_sha256!==m.sha256||proposal.entries.length!==m.rows)
   throw Error('Mismatched source-bound proposal '+task);
  let changed=0;
  for(const edit of edits){
   const key=task+':'+edit.row_index,row=proposal.entries[edit.row_index],source=input.entries[edit.row_index];
   if(!row||!source||!isDeepStrictEqual(row.identity,edit.identity)
      ||!isDeepStrictEqual(row.original,edit.original)
      ||!isDeepStrictEqual(sourceId(source),edit.identity)
      ||!isDeepStrictEqual(source.current??null,edit.original))
    throw Error('Source identity drift '+key);
   if(row.verification!=='needs-review'||row.external_human_review!==false
      ||row.full_dictionary_senses_reviewed!==false)throw Error('Unexpected approval '+key);
   const before=row.draft_method==='offline-context-first-draft'
     &&row.proposed?.example===edit.old_example
     &&row.proposed?.example_translation===edit.old_translation;
   const after=row.draft_method==='editorial-context-rewrite-needs-review'
     &&row.proposed?.example===edit.example&&row.proposed?.example_translation===edit.translation;
   if(!before&&!after)throw Error('Concurrent edit detected '+key);
   if(after){summary.already++;continue;}
   row.proposed.example=edit.example;
   row.proposed.example_translation=edit.translation;
   row.draft_method='editorial-context-rewrite-needs-review';
   if(!Array.isArray(row.issues))throw Error('Missing issue history '+key);
   row.issues.push('原机械语境已经逐词改写为实际用法，未经独立权威词典审校。');
   row.issues.push(edit.review_note);
   row.change_reason='逐词校改英文例句和中文翻译；原词条来源、词性、用户数据不变。';
   summary.edited++;changed++;
  }
  const remaining=proposal.entries.filter(e=>e.draft_method==='offline-context-first-draft').length;
  if(remaining)throw Error('Task has unhandled mechanical examples '+task+' '+remaining);
  summary.tasks.push({task,patched:edits.length,edited:changed});
  summary.remaining_mechanical_in_target_tasks+=remaining;
  if(changed)writes.push({filename,contents:JSON.stringify(proposal,null,2)+'\n'});
 }
 if(summary.edited+summary.already!==90||summary.tasks.length!==3)throw Error('Patch count mismatch');
 if(apply)for(const w of writes)fs.writeFileSync(w.filename,w.contents);
 summary.modified_files=writes.length;
 summary.applied=apply;
 return summary;
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.some(x=>x!=='--apply'))throw Error('Unknown option');
 console.log(JSON.stringify(run(ROOT,{apply:args.includes('--apply')}),null,2));
}
module.exports={run,FILES};
