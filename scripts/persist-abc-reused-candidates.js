'use strict';
/*
 * Materialize 1,640 (as of Oct 17 2026) previously reviewed bilingual sentence
 * candidates into source-task sidecars. No results, progress or seeds modified.
 * Every candidate still awaits independent dictionary review.
 *
 * node scripts/persist-abc-reused-candidates.js               # dry run
 * node scripts/persist-abc-reused-candidates.js --apply       # write sidecars
 */
const fs=require('node:fs');
const path=require('node:path');
const {generate}=require('./reuse-abc-local-examples');
const {plan}=require('./plan-next-model-review');
const ROOT=path.resolve(__dirname,'..');

function materialize(root=ROOT,{apply=false}={}){
  const before=plan(root,{save:false});
  const {summary,candidates}=generate(root,{save:false});
  if(summary.candidates_available!==candidates.length)
    throw Error('Candidate count mismatch, abort');
  if(before.all.result_rows+before.all.rows_not_yet_drafted!==summary.input_rows)
    throw Error('Worker result coverage changed while recovering, abort');
  const groups=new Map(),seen=new Set();
  for(const record of candidates){
    if(!['A','B'].includes(record.worker))throw Error('Only undrafted A/B rows may be recovered');
    const id=record.worker+'/'+record.task_id+'/'+record.row_index;
    if(seen.has(id))throw Error('Duplicate candidate identity: '+id);
    seen.add(id);
    if(record.verification!=='needs-review'
      ||record.external_human_review!==false
      ||record.full_dictionary_senses_reviewed!==false)
      throw Error('Candidate approval anomaly: '+id);
    const groupKey=record.worker+'/'+record.task_id;
    if(!groups.has(groupKey))groups.set(groupKey,[]);
    groups.get(groupKey).push(record);
  }
  const planned=[];
  for(const [id,rows] of groups){
    rows.sort((a,b)=>a.row_index-b.row_index);
    const [worker,taskId]=id.split('/');
    const source=new Set(rows.map(x=>x.input_sha256));
    if(source.size!==1)throw Error('Multiple task input hashes '+id);
    const filename=path.join(root,'docs/model-task-results',
      'worker-'+worker,taskId,'reused-candidates.json');
    const document={
      task_id:taskId,input_sha256:rows[0].input_sha256,
      operation:'previously-authored-examples-for-independent-review',
      source:'existing-moci-seed-material-not-new-dictionary-verification',
      not_an_installed_or_accepted_vocabulary_result:true,
      entries:rows.map(x=>({
        row_index:x.row_index,identity:x.identity,original:x.original,
        suggested:x.suggested,provenance:x.provenance,
        risk_flags:x.risk_flags,
        verification:'needs-review',
        external_human_review:false,full_dictionary_senses_reviewed:false,
        authoritative_dictionary_sense_validation:false,
        issues:[
          '历史模型对所选义项的初审不等于独立权威词典全义项复核。',
          ...(x.risk_flags.includes('cross-source-sense-unverified')
            ? ['跨源或高考 PDF 匹配仅按词头/词性，存在义项不同风险，不得自动回填正式 result.json。']:[]),
        ],
      })),
    };
    const text=JSON.stringify(document,null,2)+'\n';
    if(fs.existsSync(filename)){
      const existing=fs.readFileSync(filename,'utf8');
      if(existing!==text)
        throw Error('Existing candidate sidecar differs; no overwrite: '+filename);
      planned.push({worker,taskId,rows:rows.length,filename,already_exists:true,text});
    } else {
      planned.push({worker,taskId,rows:rows.length,filename,already_exists:false,text});
    }
  }
  if(planned.reduce((n,x)=>n+x.rows,0)!==candidates.length)
    throw Error('Rows lost while grouping');
  const counts={
    input_source_rows:summary.input_rows,
    existing_worker_draft_rows:summary.previously_drafted_rows,
    reused_example_candidate_rows:candidates.length,
    task_sidecars:planned.length,
    new_sidecars:planned.filter(x=>!x.already_exists).length,
    existing_sidecars:planned.filter(x=>x.already_exists).length,
    by_worker:summary.per_worker,approved:0,installed:0,
    no_source_result_or_learning_state_touched:true,
  };
  if(apply) {
    // Refuse mutations until *all* input and existing-file checks pass.
    for(const file of planned.filter(x=>!x.already_exists)){
      fs.mkdirSync(path.dirname(file.filename),{recursive:true});
      fs.writeFileSync(file.filename,file.text,{flag:'wx'});
    }
    const after=plan(root,{save:false});
    if(after.all.result_rows!==before.all.result_rows
      ||after.all.rows_not_yet_drafted!==before.all.rows_not_yet_drafted)
      throw Error('Unexpected worker draft mutation after writing sidecars');
  }
  return counts;
}
if(require.main===module) {
 const flags=process.argv.slice(2);
 if(flags.some(f=>f!=='--apply'))throw Error('Unknown argument');
 console.log(JSON.stringify(materialize(ROOT,{apply:flags.includes('--apply')}),null,2));
}
module.exports={materialize};
