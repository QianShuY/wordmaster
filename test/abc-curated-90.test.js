'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {run,FILES}=require('../scripts/apply-abc-curated-90');
const {report}=require('../scripts/audit-abc-example-quality');
test('90 sense-grounded English-Chinese drafts are source-locked and safe to reapply',()=>{
 const r=run(ROOT,{apply:false});
 assert.equal(r.total,90);
 assert.equal(r.edited+r.already,90);
 assert.equal(r.remaining_mechanical_in_target_tasks,0);
 assert.equal(r.tasks.length,3);
 assert.equal(r.accepted,0);
 assert.equal(r.installed,0);
 assert.equal(r.student_database_modified,false);
 const patches=FILES.flatMap(p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8')).entries);
 assert.equal(patches.length,90);
 for(const p of patches){
  const file=path.join(ROOT,'docs/model-task-results','worker-'+p.worker,p.task_id,'result.json');
  const row=JSON.parse(fs.readFileSync(file,'utf8')).entries[p.row_index];
  assert.deepEqual(row.original,p.original);
  assert.deepEqual(row.identity,p.identity);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.ok([p.old_example,p.example].includes(row.proposed.example));
  assert.ok(/[一-鿿]/.test(p.translation));
 }
});
test('no proposal coverage loss after editorial examples',()=>{
 const d=report(ROOT,{save:false});
 assert.equal(d.rows,26612);
 assert.equal(d.missing_pairs,0);
 assert.equal(d.installed,0);
 assert.equal(d.approved,0);
});

test('noun example grammar and sandboxed sandy source POS correction remain stable',()=>{
 const b=(task,index)=>JSON.parse(fs.readFileSync(path.join(ROOT,
  'docs/model-task-results','worker-A',task,'result.json'),'utf8')).entries[index];
 const sandy=b('cet4-027',6);
 assert.equal(sandy.identity.word,'sandy');
 assert.equal(sandy.original.pos,'n.','the frozen source still records its old error');
 assert.equal(sandy.selected_sense.pos,'a.');
 assert.equal(sandy.proposed.pos,'a.');
 assert.match(sandy.proposed.example,/sandy beach/);
 const catholic=b('cet6-002',28),ceramic=b('cet6-002',34);
 for(const row of [catholic,ceramic]){
  assert.equal(row.original.pos,'n.');
  assert.equal(row.selected_sense.pos,'n.');
  assert.equal(row.verification,'needs-review');
 }
 assert.match(catholic.proposed.example,/a Catholic/);
 assert.match(ceramic.proposed.example,/a ceramic/);
});
