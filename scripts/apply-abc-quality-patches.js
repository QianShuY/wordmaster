'use strict';
/**
 * Surgical English/Chinese example edits after the 26,612-row first draft.
 * Does not edit installed vocabulary, user SQLite, sources, IPA or approvals.
 *
 * node scripts/apply-abc-quality-patches.js
 * node scripts/apply-abc-quality-patches.js --apply
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {ownerOf}=require('./audit-model-evidence');
const ROOT=path.resolve(__dirname,'..');
const PATCH='docs/model-quality-patches/quality-targeted-examples-20261018.json';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function run(root=ROOT,{apply=false}={}){
 const patch=JSON.parse(fs.readFileSync(path.join(root,PATCH),'utf8'));
 if(!Array.isArray(patch.entries)||patch.entries.length!==59||patch.approved_for_installation!==false)
  throw Error('Patch unexpectedly modified or was marked approved');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
 const metas=new Map(manifest.files.map(f=>[f.task_id,f]));
 const groups=new Map(),used=new Set(),stats={
  proposed_edits:0,newly_rewritten:0,already_applied:0,wrong_pos_flagged:0,
  preserved_source:0,approved:0,installed:0,modified_learning_data:false,tasks:[]
 };
 for(const patchRow of patch.entries){
  const {worker,task_id,row_index}=patchRow;
  if(ownerOf(task_id)!==worker||!Number.isInteger(row_index)||row_index<0)
   throw Error('Unexpected worker or row index '+task_id+':'+row_index);
  const key=task_id+':'+row_index;
  if(used.has(key))throw Error('Duplicate editorial patch '+key);
  used.add(key);
  if(!groups.has(task_id))groups.set(task_id,[]);
  groups.get(task_id).push(patchRow);
 }
 const updates=[];
 for(const [task,rows] of groups){
  const meta=metas.get(task);
  if(!meta)throw Error('No manifest record '+task);
  const originalBytes=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',meta.file));
  if(sha(originalBytes)!==meta.sha256)throw Error('Source checksum changed '+task);
  const source=JSON.parse(originalBytes);
  const worker=ownerOf(task);
  const filename=path.join(root,'docs/model-task-results','worker-'+worker,task,'result.json');
  const proposal=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(proposal.task_id!==task||proposal.input_sha256!==meta.sha256||proposal.entries.length!==meta.rows)
   throw Error('Result metadata changed '+task);
  let modified=false;
  for(const edit of rows){
   const idx=edit.row_index,row=proposal.entries[idx],src=source.entries[idx],key=task+':'+idx;
   if(!row||!src||!isDeepStrictEqual(row.identity,edit.identity)
    ||!isDeepStrictEqual(row.original,edit.original)
    ||!isDeepStrictEqual(src.identity,edit.identity)
    ||!isDeepStrictEqual(src.current,edit.original))
    throw Error('Identity/original mismatch at '+key);
   if(row.verification!=='needs-review'||row.full_dictionary_senses_reviewed===true
    ||row.external_human_review===true)
    throw Error('Unexpected approval at '+key);
   if(!edit.after_example||!edit.after_translation||!/[一-鿿]/.test(edit.after_translation))
    throw Error('Invalid bilingual edit '+key);
   const before=row.proposed.example===edit.before_example
    &&row.proposed.example_translation===edit.before_translation
    &&['offline-context-first-draft','metalinguistic-placeholder'].includes(row.draft_method);
   const after=row.proposed.example===edit.after_example
    &&row.proposed.example_translation===edit.after_translation
    &&row.draft_method==='editorial-context-rewrite-needs-review';
   if(!before&&!after)throw Error('Expected old/new sentence drift at '+key);
   if(after){stats.already_applied++;continue;}
   row.proposed.example=edit.after_example;
   row.proposed.example_translation=edit.after_translation;
   row.draft_method='editorial-context-rewrite-needs-review';
   if(!Array.isArray(row.issues))row.issues=[];
   row.issues.push('已对机械例句进行人工语境改写；尚未独立核查词典全部义项，不代表正式批准。');
   row.issues.push(edit.editorial_note);
   row.change_reason='第一轮词库质量改写；原词条及学习记录不变，仍需审校。';
   // Do not alter historical POS or raw source. Record its known anomaly.
   if(task==='cet4-024'&&idx===77){
    row.selected_sense.pos='n.';
    row.issues.push('源词表 reception 错标 a.，名词义项仍需核对。');
    stats.wrong_pos_flagged++;
   }
   if(task==='cet4-025'&&idx===89){
    row.selected_sense.pos='a.';
    row.issues.push('源词表 respective 错标 ad.，形容词义项仍需核对。');
    stats.wrong_pos_flagged++;
   }
   modified=true;
   stats.newly_rewritten++;
  }
  stats.proposed_edits+=rows.length;
  stats.preserved_source+=rows.length;
  if(modified)updates.push({filename,content:JSON.stringify(proposal,null,2)+'\n'});
  stats.tasks.push({task,rows:rows.length,modified});
 }
 if(stats.proposed_edits!==59)throw Error('Not 59 corrections');
 if(apply)for(const change of updates)fs.writeFileSync(change.filename,change.content);
 stats.applied=apply;
 stats.files_changed=updates.length;
 return stats;
}
if(require.main===module){
 const a=process.argv.slice(2);
 if(a.some(x=>x!=='--apply'))throw Error('Unknown option');
 console.log(JSON.stringify(run(ROOT,{apply:a.includes('--apply')}),null,2));
}
module.exports={run};
