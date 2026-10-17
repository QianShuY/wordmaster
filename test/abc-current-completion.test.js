'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {go}=require('../scripts/complete-current-abc-batches');
const ROOT=path.resolve(__dirname,'..');
test('two current task batches are full, bilingual, review-only and do not touch source files in dry run',()=>{
 const before=['A/cet4-022','B/npee-043'].map(tag=>{
  const [worker,task]=tag.split('/');
  const file=path.join(ROOT,'docs/model-task-results','worker-'+worker,task,'result.json');
  assert.equal(fs.existsSync(file),false,task+' already has results');
  const material=path.join(path.dirname(file),'remaining-review-material.json');
  const buf=fs.readFileSync(material);
  return {file,material,buf};
 });
 const summary=go(ROOT,{apply:false});
 assert.equal(summary.expected_after-summary.existing_before,200);
 assert.equal(summary.tasks.length,2);
 assert.deepEqual(summary.tasks.map(t=>t.task),['cet4-022','npee-043']);
 assert.equal(summary.tasks.reduce((n,t)=>n+t.rows,0),200);
 assert.ok(summary.tasks.every(t=>t.original_bilingual_pairs>0
   && t.existing_sourced_candidates_reused>0
   && t.approved===0&&t.installed===0));
 assert.equal(summary.source_dictionaries_independently_reviewed,0);
 assert.equal(summary.actual_results_written,false);
 for(const old of before){
   assert.equal(fs.existsSync(old.file),false);
   assert.deepEqual(fs.readFileSync(old.material),old.buf);
 }
});
