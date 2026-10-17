'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {go}=require('../scripts/complete-current-abc-batches');
const ROOT=path.resolve(__dirname,'..');
const tasks=[['A','cet4-022'],['B','npee-043']];
test('two current bilingual batches are safe whether planned or already materialized',()=>{
 const available=tasks.map(([worker,task])=>fs.existsSync(path.join(ROOT,
  'docs/model-task-results','worker-'+worker,task,'result.json')));
 assert.equal(new Set(available).size,1,'partial commit of two task results');
 if(available[0]){
  for(const [worker,task] of tasks){
   const dir=path.join(ROOT,'docs/model-task-results','worker-'+worker);
   const source=JSON.parse(fs.readFileSync(path.join(dir,task,'remaining-review-material.json'),'utf8'));
   const result=JSON.parse(fs.readFileSync(path.join(dir,task,'result.json'),'utf8'));
   const progress=JSON.parse(fs.readFileSync(path.join(dir,'progress.json'),'utf8'));
   assert.equal(result.task_id,task);
   assert.equal(result.input_sha256,source.input_sha256);
   assert.equal(result.status,'proposal');
   assert.equal(result.entries.length,100);
   assert.equal(progress.tasks.find(x=>x.task_id===task)?.processed_rows,100);
   assert.equal(progress.tasks.find(x=>x.task_id===task)?.status,'submitted');
   for(let i=0;i<result.entries.length;i++){
    const row=result.entries[i];
    assert.deepEqual(row.identity,source.entries[i].identity);
    assert.deepEqual(row.original,source.entries[i].original);
    assert.equal(row.verification,'needs-review');
    assert.equal(row.external_human_review,false);
    assert.equal(row.full_dictionary_senses_reviewed,false);
    assert.equal(row.evidence.length,0);
    assert.ok(row.proposed.example.trim().length>15);
    assert.ok(/[一-鿿]/.test(row.proposed.example_translation));
   }
  }
 } else {
  const pre=tasks.map(([worker,task])=>{
   const file=path.join(ROOT,'docs/model-task-results','worker-'+worker,task,'remaining-review-material.json');
   return {file,bytes:fs.readFileSync(file)};
  });
  const summary=go(ROOT,{apply:false});
  assert.equal(summary.expected_after-summary.existing_before,200);
  assert.deepEqual(summary.tasks.map(t=>t.task),['cet4-022','npee-043']);
  assert.equal(summary.tasks.reduce((n,t)=>n+t.rows,0),200);
  assert.ok(summary.tasks.every(t=>t.original_bilingual_pairs>0
    && t.existing_sourced_candidates_reused>0
    && t.approved===0&&t.installed===0));
  assert.equal(summary.source_dictionaries_independently_reviewed,0);
  assert.equal(summary.actual_results_written,false);
  for(const old of pre)assert.deepEqual(fs.readFileSync(old.file),old.bytes);
 }
});
