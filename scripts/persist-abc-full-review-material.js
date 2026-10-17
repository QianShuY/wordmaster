'use strict';
/**
 * Persist the *entire remaining* A/B/C example-sourcing queue into immutable,
 * source-bound task sidecars. A reviewed-looking donor is never approval.
 *
 * node scripts/persist-abc-full-review-material.js
 * node scripts/persist-abc-full-review-material.js --apply
 *
 * No result.json, progress.json, seeds, database or user state writes.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {combine} = require('./merge-abc-candidate-coverage');
const {plan} = require('./plan-next-model-review');
const ROOT = path.resolve(__dirname,'..');
const INPUT = 'docs/model-tasks-20261015';
const safeTask = x => /^(?:cet4|cet6|npee|tem|gaokao)-\d{3}$/.test(x);
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

function prepare(root=ROOT,{apply=false}={}) {
  const before=plan(root,{save:false});
  const ledger=combine(root,{save:false});
  if(ledger.summary.actual_worker_proposals!==before.all.result_rows
     ||ledger.summary.remaining_proposal_rows!==before.all.rows_not_yet_drafted)
    throw Error('Verified worker prefixes and candidate ledger disagree');
  const tasks=JSON.parse(fs.readFileSync(path.join(root,INPUT,'manifest.json'),'utf8')).files;
  const keys=new Map(),manifest=new Map();
  const {ownerOf}=require('./audit-model-evidence');
  for(const file of tasks){
    if(!safeTask(file.task_id)||manifest.has(file.task_id))throw Error('Unsafe or duplicated task id: '+file.task_id);
    manifest.set(file.task_id,{...file,owner:ownerOf(file.task_id)});
  }
  for(const r of ledger.result){
    const m=manifest.get(r.task_id);
    if(!m||!['A','B','C'].includes(r.worker)||m.owner!==r.worker||r.input_sha256!==m.sha256)
      throw Error('Unmatched worker manifest / hash: '+r.task_id);
    if(!Number.isInteger(r.row_index)||r.row_index<0||r.row_index>=m.rows)
      throw Error('Invalid row index: '+r.task_id);
    const key=r.task_id+':'+r.row_index;
    if(keys.has(key))throw Error('Duplicated ledger row '+key);
    keys.set(key,r);
  }
  const planned=[];
  const stats={total_source_rows:ledger.summary.total_source_rows,
    existing_worker_drafts:before.all.result_rows,
    remaining_to_author_or_source:ledger.result.length,
    exact_source_candidate_rows:0,crossbook_candidate_rows:0,
    rows_with_any_bilingual_candidate:0,rows_requiring_new_original_example:0,
    task_sidecars:0,already_existing:0,new_sidecars:0,
    independent_dictionary_reviews_performed:0,approved:0,installed:0,
    workflow:'full-source-coverage-for-human-drafting-not-example-completion'};
  for(const m of manifest.values()){
    const inputBytes=fs.readFileSync(path.join(root,INPUT,m.file));
    if(sha(inputBytes)!==m.sha256)throw Error('Source task changed: '+m.task_id);
    const input=JSON.parse(inputBytes.toString('utf8'));
    const results=path.join(root,'docs/model-task-results','worker-'+m.owner,m.task_id);
    const resultPath=path.join(results,'result.json');
    const drafted=fs.existsSync(resultPath)
      ?JSON.parse(fs.readFileSync(resultPath,'utf8')).entries.length:0;
    if(drafted===m.rows)continue;
    const entries=[];
    for(let i=drafted;i<m.rows;i++){
      const r=keys.get(m.task_id+':'+i),source=input.entries[i];
      if(!r||!source)throw Error('Missing candidate row '+m.task_id+':'+i);
      if(r.identity&&JSON.stringify(r.identity)!==JSON.stringify(source.identity))
        throw Error('Source identity mismatch '+m.task_id+':'+i);
      const exact=r.exact_source_candidate;
      const alternative=r.crossbook_options;
      const hasPair=Boolean(exact || alternative.length);
      stats.exact_source_candidate_rows+=Number(Boolean(exact));
      stats.crossbook_candidate_rows+=Number(alternative.length>0);
      stats.rows_with_any_bilingual_candidate+=Number(hasPair);
      stats.rows_requiring_new_original_example+=Number(!hasPair);
      entries.push({
        row_index:i,
        identity:source.identity??null,
        original:source.current??null,
        source_entry:source.source_entry??null,
        headword:source.headword??null,
        pdf_page:source.pdf_page??null,
        handling:source.handling??null,
        priority:r.priority,
        source_material:exact?{
          example:exact.suggested.example,
          example_translation:exact.suggested.example_translation,
          selected_meaning:exact.suggested.selected_meaning??null,
          provenance:exact.provenance,
          risk_flags:exact.risk_flags,
        }:null,
        crossbook_review_options:alternative,
        needs_new_original_example:!hasPair,
        risk_flags:r.risk_flags,
        verification:'needs-review',
        human_approved:false,
        full_dictionary_senses_reviewed:false,
        authoritative_dictionary_sense_validation:false,
        status:hasPair?'candidate-requires-sense-check':'new-original-example-required',
      });
    }
    const doc={
      task_id:m.task_id,input_sha256:m.sha256,
      purpose:'review-only source material for every undrafted A/B/C row',
      results_are_not_approved_or_installed:true,
      rows:entries.length,
      entries,
    };
    const filename=path.join(results,'remaining-review-material.json');
    const body=JSON.stringify(doc,null,2)+'\n';
    if(fs.existsSync(filename)){
      if(fs.readFileSync(filename,'utf8')!==body)
        throw Error('Existing review material differs, refuse overwrite '+filename);
      stats.already_existing++;
    }else stats.new_sidecars++;
    planned.push({filename,body,exists:fs.existsSync(filename)});
    stats.task_sidecars++;
  }
  if(stats.rows_with_any_bilingual_candidate+stats.rows_requiring_new_original_example
    !==stats.remaining_to_author_or_source)
    throw Error('Source-material accounting failed');
  if(stats.task_sidecars!==planned.length)throw Error('Source-material task accounting failed');
  if(apply)for(const file of planned.filter(x=>!x.exists)){
    fs.mkdirSync(path.dirname(file.filename),{recursive:true});
    fs.writeFileSync(file.filename,file.body,{flag:'wx'});
  }
  const after=plan(root,{save:false});
  if(after.all.result_rows!==before.all.result_rows
    ||after.all.rows_not_yet_drafted!==before.all.rows_not_yet_drafted)
    throw Error('Worker drafts changed while writing review materials');
  return stats;
}
if(require.main===module){
  const allowed=new Set(['--apply']),flags=process.argv.slice(2);
  if(flags.some(f=>!allowed.has(f)))throw Error('Unknown option');
  console.log(JSON.stringify(prepare(ROOT,{apply:flags.includes('--apply')}),null,2));
}
module.exports={prepare};
