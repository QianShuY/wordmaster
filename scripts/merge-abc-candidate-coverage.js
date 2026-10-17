'use strict';
/**
 * Merge independent candidate sources without double counting or approval.
 * A candidate is NOT a reviewed dictionary entry, even from exact seed source.
 *
 * npm run abc:coverage
 */
const fs=require('node:fs');
const path=require('node:path');
const { plan }=require('./plan-next-model-review');
const { generate }=require('./reuse-abc-local-examples');
const { candidates }=require('./transfer-abc-crossbook-examples');
const ROOT=path.resolve(__dirname,'..');
const key=x=>x.task_id+':'+x.row_index;
function combine(root=ROOT,{save=true,outputDir=path.join(root,'output/refinement/abc-bulk')}={}){
  const actual=plan(root,{save:false});
  const reused=generate(root,{save:false});
  const cross=candidates(root,{save:false});
  const a=new Map(), b=new Map();
  for(const row of reused.candidates){
    const id=key(row);
    if(a.has(id))throw Error('Duplicate exact-source candidate '+id);
    a.set(id,row);
  }
  for(const row of cross.matched){
    const id=key(row);
    if(b.has(id))throw Error('Duplicate crossbook candidate '+id);
    b.set(id,row);
  }
  const result=[];
  const count={exact_only:0,crossbook_only:0,both:0,neither:0};
  const group={A:{...count},B:{...count},C:{...count}};
  const allKeys=new Set([...a.keys(),...b.keys()]);
  for(const id of allKeys){
    const exact=a.get(id),possible=b.get(id);
    if(exact&&possible&&(exact.input_sha256!==possible.input_sha256
      || exact.worker!==possible.worker))throw Error('Cross-source identity mismatch '+id);
  }
  const tasks=JSON.parse(fs.readFileSync(
    path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8')).files;
  const { ownerOf }=require('./audit-model-evidence');
  let drafts=0;
  for(const task of tasks){
    const worker=ownerOf(task.task_id);
    const input=JSON.parse(fs.readFileSync(
      path.join(root,'docs/model-tasks-20261015',task.file),'utf8'));
    const draftPath=path.join(root,'docs/model-task-results',
      'worker-'+worker,task.task_id,'result.json');
    const done=fs.existsSync(draftPath)
      ? JSON.parse(fs.readFileSync(draftPath,'utf8')).entries.length : 0;
    drafts+=done;
    for(let i=done;i<input.entries.length;i++){
      const id=task.task_id+':'+i, exact=a.get(id),other=b.get(id);
      if(exact && (exact.input_sha256!==task.sha256
        || exact.row_index!==i))throw Error('Outdated exact-source candidate '+id);
      if(other && (other.input_sha256!==task.sha256
        || other.row_index!==i))throw Error('Outdated cross-book option '+id);
      const type=exact?(other?'both':'exact_only'):(other?'crossbook_only':'neither');
      count[type]++;group[worker][type]++;
      const row=input.entries[i];
      result.push({
        worker,task_id:task.task_id,row_index:i,input_sha256:task.sha256,
        identity:row.identity??null,headword:row.identity?.word??row.headword,
        priority:type==='both'||type==='exact_only'
          ? 'P1-exact-source-unverified'
          : type==='crossbook_only'?'P2-crossbook-sense-check-required'
            : 'P3-author-from-original',
        exact_source_candidate:exact?{
          suggested:exact.suggested,provenance:exact.provenance,
          risk_flags:exact.risk_flags,
        }:null,
        crossbook_options:other?other.options:[],
        risk_flags:[
          ...(exact?exact.risk_flags:[]),
          ...(other?other.risk_flags:[]),
        ],
        status:'not-drafted-or-approved',
      });
    }
  }
  if(drafts!==actual.all.result_rows
    || result.length!==actual.all.rows_not_yet_drafted
    || result.length!==count.exact_only+count.crossbook_only+count.both+count.neither)
    throw Error('Candidate coverage accounting disagrees with verified manifest');
  const summary={
    operation:'merge-actual-source-and-crossbook-options',
    total_source_rows:actual.all.result_rows+result.length,
    actual_worker_proposals:actual.all.result_rows,
    remaining_proposal_rows:result.length,
    covered_by_exact_source:count.exact_only+count.both,
    covered_by_crossbook_options:count.crossbook_only+count.both,
    covered_by_any_candidate:count.exact_only+count.crossbook_only+count.both,
    still_needing_original_example:count.neither,
    overlap:count.both,exclusive_counts:count,by_worker:group,
    accepted:0,installed:0,
    caution:'Exact-source matches are only prior model sense reviews; cross-book POS matches can have unrelated meanings. Neither is approved or installed.',
  };
  if(save){
    fs.mkdirSync(outputDir,{recursive:true});
    fs.writeFileSync(path.join(outputDir,'coverage-summary.json'),JSON.stringify(summary,null,2)+'\n');
    fs.writeFileSync(path.join(outputDir,'coverage-review-queue.json'),JSON.stringify(result,null,2)+'\n');
  }
  return {summary,result};
}
if(require.main===module)console.log(JSON.stringify(combine().summary,null,2));
module.exports={combine};
