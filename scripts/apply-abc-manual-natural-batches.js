'use strict';
/**
 * Apply a bounded set of English/Chinese individually authored example patches.
 * Original identity, source snapshot, POS, IPA, evidence, user data and
 * prior approvals remain unchanged. Supports preview, apply and idempotence.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..');
const FILES=[
 'docs/model-quality-patches/manual-natural-tem-001-20261018.json',
 'docs/model-quality-patches/manual-natural-tem-002-20261018.json',
 'docs/model-quality-patches/manual-natural-cet6-001-20261018.json',
];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const counts={ 'tem-001':83,'tem-002':87,'cet6-001':57 };
function main(root=ROOT,{apply=false}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const look=new Map(manifest.files.map(m=>[m.task_id,m]));
 const patches=FILES.flatMap(p=>{
  const batch=JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  if(batch.approved!==false||batch.independent_dictionary_review!==false
    ||!counts[batch.source]||batch.entries.length!==counts[batch.source])
   throw Error('Unexpected batch metadata '+p);
  return batch.entries;
 });
 const stats={patch_rows:patches.length,newly_fixed:0,already_fixed:0,
  task_files_changed:0,remaining_offline_in_target_tasks:0,
  approved:0,installed:0,user_data_touched:false,details:[]};
 const groups=new Map(),seen=new Set();
 for(const p of patches){
  const key=p.task_id+':'+p.row_index;
  if(seen.has(key))throw Error('Duplicate patch '+key);
  seen.add(key);
  if(!Number.isInteger(p.row_index)||p.row_index<0
     ||ownerOf(p.task_id)!==p.worker||!counts[p.task_id])
   throw Error('Unexpected patch id '+key);
  if(!p.example?.trim()||!p.translation?.trim()||!/[一-鿿]/.test(p.translation))
   throw Error('Missing bilingual content '+key);
  const word=(p.identity?.word||p.identity?.headword||'').toLowerCase();
  const base=word.replace(/ \d+$/,'');
  if(!p.example.toLowerCase().includes(base)||!base)
   throw Error('Example missing target headword '+key);
  if(/\b(?:attribute|boring|bound|boom|affect) [123]\b/i.test(p.example))
   throw Error('Sense number leaked into learner example '+key);
  if(!groups.has(p.task_id))groups.set(p.task_id,[]);
  groups.get(p.task_id).push(p);
 }
 if(patches.length!==227)throw Error('Expected exactly 227 authored examples');
 const writes=[];
 for(const [task,rows] of groups){
  const meta=look.get(task),worker=ownerOf(task);
  if(!meta||meta.rows!==100)throw Error('Unknown source task '+task);
  const inputBytes=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',meta.file));
  if(sha(inputBytes)!==meta.sha256)throw Error('Frozen input changed '+task);
  const input=JSON.parse(inputBytes);
  const file=path.join(root,'docs/model-task-results','worker-'+worker,task,'result.json');
  const result=JSON.parse(fs.readFileSync(file,'utf8'));
  if(result.task_id!==task||result.input_sha256!==meta.sha256
    ||result.entries.length!==meta.rows||result.status!=='proposal')
   throw Error('Result identity mismatch '+task);
  let changed=0;
  for(const edit of rows){
   const i=edit.row_index,row=result.entries[i],old=input.entries[i],key=task+':'+i;
   if(!row||!old||!isDeepStrictEqual(row.identity,edit.identity)
     ||!isDeepStrictEqual(row.original,edit.original)
     ||!isDeepStrictEqual(old.identity,edit.identity)
     ||!isDeepStrictEqual(old.current,edit.original))
    throw Error('Original identity mismatch '+key);
   if(row.verification!=='needs-review'
      ||row.full_dictionary_senses_reviewed!==false||row.external_human_review!==false)
    throw Error('Unexpected approval or immutable field '+key);
   const isBefore=row.proposed.example===edit.expected_example
    &&row.proposed.example_translation===edit.expected_translation
    &&['offline-context-first-draft','metalinguistic-placeholder'].includes(row.draft_method);
   const isAfter=row.proposed.example===edit.example
    &&row.proposed.example_translation===edit.translation
    &&row.draft_method==='editorial-context-rewrite-needs-review';
   if(!isBefore&&!isAfter)throw Error('Concurrent edit detected '+key);
   if(isAfter){stats.already_fixed++;continue;}
   row.proposed.example=edit.example;
   row.proposed.example_translation=edit.translation;
   row.draft_method='editorial-context-rewrite-needs-review';
   if(!Array.isArray(row.issues))throw Error('Unexpected prior issue shape '+key);
   row.issues.push('已改写机械模板例句，按原词条义项配对英文与中文；完整权威词典审核尚未完成。');
   row.issues.push(edit.review_note);
   row.change_reason='按原始义项逐词改写自然例句，未修改来源身份、用户学习记录或审核状态。';
   changed++;stats.newly_fixed++;
  }
  if(changed)writes.push({file,body:JSON.stringify(result,null,2)+'\n'});
  stats.details.push({task,source_rows:rows.length,changed,untouched_others:100-rows.length});
  stats.remaining_offline_in_target_tasks+=result.entries.filter(e=>
    ['offline-context-first-draft','metalinguistic-placeholder'].includes(e.draft_method)).length;
 }
 stats.task_files_changed=writes.length;
 if(stats.newly_fixed+stats.already_fixed!==227)throw Error('Patch accounting mismatch');
 if(stats.remaining_offline_in_target_tasks!==0)throw Error('Target task still has mechanical drafts');
 if(apply)for(const w of writes)fs.writeFileSync(w.file,w.body);
 stats.applied=apply;
 return stats;
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.some(x=>x!=='--apply'))throw Error('Unknown flag');
 console.log(JSON.stringify(main(ROOT,{apply:args.includes('--apply')}),null,2));
}
module.exports={main,FILES,counts};
