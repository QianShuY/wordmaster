'use strict';
/**
 * Read-only cross-book/example search for the whole 26,612-row A/B/C plan.
 * A matching spelling and part of speech NEVER proves matching meanings.
 * Outputs alternative donor examples, not new approved result rows.
 *
 * npm run abc:crossbook
 */
const fs = require('node:fs');
const path = require('node:path');
const { plan } = require('./plan-next-model-review');
const { ownerOf } = require('./audit-model-evidence');
const { posType } = require('./reuse-abc-local-examples');
const ROOT = path.resolve(__dirname, '..');
const norm = x => String(x ?? '').trim();
const pairPresent = p => Boolean(norm(p?.example) && norm(p?.example_translation));
const sourcePos = e => {
  const a = posType(e.original?.pos);
  const b = posType(e.selected_sense?.pos);
  // If a worker selected a different word class, it must be handled in the
  // homograph/part-of-speech review queue. Never reuse it silently.
  return a && b && a === b ? a : null;
};
function candidates(root=ROOT,{save=true,outputDir=path.join(root,'output/refinement/abc-bulk'),
  maxDonors=4}={}) {
  if(!Number.isInteger(maxDonors)||maxDonors<1||maxDonors>20)
    throw Error('maxDonors must be in [1,20]');
  const checked=plan(root,{save:false}); // SHA, original, identity, status
  const manifest=JSON.parse(fs.readFileSync(
    path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
  const taskDir=path.join(root,'docs/model-tasks-20261015');
  const results=path.join(root,'docs/model-task-results');
  const donorIndex=new Map();
  const tasks=[];
  let donors=0,rejectedDonors=0;
  for(const item of manifest.files){
    const worker=ownerOf(item.task_id);
    if(!worker)throw Error('Unowned ABC task: '+item.task_id);
    const input=JSON.parse(fs.readFileSync(path.join(taskDir,item.file),'utf8'));
    const resultPath=path.join(results,'worker-'+worker,item.task_id,'result.json');
    const existing=fs.existsSync(resultPath)
      ? JSON.parse(fs.readFileSync(resultPath,'utf8')).entries : [];
    tasks.push({item,worker,input,existing});
    for(let i=0;i<existing.length;i++){
      const row=existing[i],word=norm(row.identity?.word);
      const pos=sourcePos(row);
      if(!word||!pos||!pairPresent(row.proposed)){
        rejectedDonors++;
        continue;
      }
      const token=word+'\0'+pos;
      const donor={
        worker,task_id:item.task_id,row_index:i,word,part_of_speech:pos,
        homograph:row.identity.homograph??null,
        original_pos:row.original.pos,original_meaning:row.original.meaning,
        selected_sense:row.selected_sense,
        example:row.proposed.example,translation:row.proposed.example_translation,
        source_file:row.identity.source_file,
        source_line:row.identity.source_line,
        worker_claim:row.verification,
      };
      if(!donorIndex.has(token))donorIndex.set(token,[]);
      donorIndex.get(token).push(donor);
      donors++;
    }
  }
  // The index is sorted independently from branch tree traversal.
  for(const list of donorIndex.values()){
    list.sort((a,b)=>a.task_id.localeCompare(b.task_id)||a.row_index-b.row_index);
  }
  const matched=[],skipped={no_pos:0,no_donor:0,homograph_conflict:0},byWorker={A:0,B:0,C:0};
  let examined=0;
  for(const task of tasks){
    const {item,worker,input,existing}=task;
    for(let index=existing.length;index<input.entries.length;index++){
      examined++;
      const row=input.entries[index];
      const word=norm(row.identity?.word??row.headword);
      const pos=posType(row.current?.pos);
      let parts=[];
      if(pos)parts=[pos];
      else if(item.task_id.startsWith('gaokao-')){
        // Gaokao PDF headwords can merge or split multiple lexemes. Only
        // possible matching POS from an actually stored candidate.
        parts=[...new Set((row.candidates??[]).filter(c=>norm(c.word)===word)
          .map(c=>posType(c.pos)).filter(Boolean))];
      }
      if(!word||!parts.length){skipped.no_pos++;continue;}
      const options=parts.flatMap(p=>donorIndex.get(word+'\0'+p)||[])
        .filter(x=>{
          if(row.identity && x.source_file===row.identity.source_file){
            // A second occurrence of the same spelling in the source book
            // may be a different homograph. Prevent cross-line borrowing.
            return false;
          }
          if(row.identity?.homograph!=null && x.homograph!==row.identity.homograph)
            return false;
          return true;
        });
      if(!options.length){skipped.no_donor++;continue;}
      // Multiple different examples are ALTERNATIVES. Do not pick one,
      // even if only one survives the POS/homograph checks.
      const examples=new Map();
      for(const d of options){
        const key=JSON.stringify([d.example,d.translation]);
        if(!examples.has(key))examples.set(key,d);
      }
      const ranked=[...examples.values()].sort((a,b)=>
        a.task_id.localeCompare(b.task_id)||a.row_index-b.row_index);
      matched.push({
        worker,task_id:item.task_id,input_sha256:item.sha256,row_index:index,
        identity:row.identity??null,headword:word,requested_pos:parts,
        original:row.current??null,
        pdf_headword:row.headword??null,handling:row.handling??null,
        donor_count:ranked.length,options:ranked.slice(0,maxDonors),
        risk_flags:[
          'cross-book-example-not-sense-verified',
          'same-spelling-and-POS-not-equal-sense',
          ...(row.identity?.homograph!=null||ranked.some(x=>x.homograph!=null)
            ? ['homograph-needs-manual-review']:[]),
          ...(row.headword?['gaokao-pdf-source-review-required']:[]),
          ...(ranked.length>maxDonors?['more-options-omitted']:[]),
        ],
        decision:'review-required-not-installed',
      });
      byWorker[worker]++;
    }
  }
  if(examined!==checked.all.rows_not_yet_drafted)
    throw Error('Crossbook undrafted count disagrees with verified manifest');
  const summary={
    operation:'crossbook-alternative-bilingual-examples',
    input_rows:checked.all.result_rows+examined,
    rows_without_worker_proposal:examined,
    matching_rows:matched.length,
    unmatched_rows:examined-matched.length,
    donor_examples_eligible:donors,
    donor_examples_rejected:rejectedDonors,
    per_worker:byWorker,skipped,
    accepted:0,installed:0,
    note:'Spelling and POS match alone do not verify selected meaning. Every suggestion is a separate unapproved review option.',
  };
  if(save){
    fs.mkdirSync(outputDir,{recursive:true});
    fs.writeFileSync(path.join(outputDir,'crossbook-summary.json'),
      JSON.stringify(summary,null,2)+'\n');
    fs.writeFileSync(path.join(outputDir,'crossbook-options.json'),
      JSON.stringify(matched,null,2)+'\n');
  }
  return {summary,matched};
}
if(require.main===module)console.log(JSON.stringify(candidates().summary,null,2));
module.exports={candidates};
