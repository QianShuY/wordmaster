'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {combine}=require('../scripts/merge-abc-candidate-coverage');
const root=path.resolve(__dirname,'..');

test('full ABC cross-source candidate ledger deduplicates by exact task row',()=>{
 const {summary,result}=combine(root,{save:false});
 assert.equal(summary.total_source_rows,26612);
 assert.equal(summary.actual_worker_proposals,14739);
 assert.equal(summary.remaining_proposal_rows,11873);
 assert.equal(summary.covered_by_exact_source,1640);
 assert.equal(summary.covered_by_crossbook_options,8206);
 assert.equal(summary.covered_by_any_candidate+summary.still_needing_original_example,11873);
 assert.ok(summary.covered_by_any_candidate>=8206);
 assert.ok(summary.covered_by_any_candidate<=9846);
 assert.equal(result.length,11873);
 assert.equal(new Set(result.map(r=>r.task_id+':'+r.row_index)).size,11873);
 assert.equal(summary.accepted,0);
 assert.equal(summary.installed,0);
});
test('sources are prioritized for reviewer rather than silently promoted',()=>{
 const {result}=combine(root,{save:false});
 for(const row of result){
   assert.equal(row.status,'not-drafted-or-approved');
   if(row.exact_source_candidate){
     assert.ok(row.exact_source_candidate.provenance.length>0);
     assert.ok(row.exact_source_candidate.suggested.example);
     assert.ok(row.exact_source_candidate.suggested.example_translation);
     assert.equal(row.priority,'P1-exact-source-unverified');
   }else if(row.crossbook_options.length>0){
     assert.equal(row.priority,'P2-crossbook-sense-check-required');
     assert.ok(row.risk_flags.includes('same-spelling-and-POS-not-equal-sense'));
   }else{
     assert.equal(row.priority,'P3-author-from-original');
   }
 }
});
test('coverage export is offline, read-only, does not copy into seed or worker result',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moci-coverage-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const protectedPath=path.join(root,'docs/model-task-results/worker-B/npee-040/result.json');
 const before=fs.readFileSync(protectedPath);
 const {summary}=combine(root,{outputDir:dir});
 assert.equal(summary.accepted,0);
 assert.equal(summary.installed,0);
 assert.deepEqual(fs.readFileSync(protectedPath),before);
 const wrote=fs.readdirSync(dir).sort();
 assert.deepEqual(wrote,['coverage-review-queue.json','coverage-summary.json']);
});
