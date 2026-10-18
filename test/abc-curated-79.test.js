'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {run,FILES}=require('../scripts/apply-abc-curated-79');
const {report}=require('../scripts/audit-abc-example-quality');
const frozen=JSON.parse(fs.readFileSync(path.join(ROOT,FILES[0]),'utf8'));
const POS={significant:'a.',somewhat:'ad.',constant:'adj.',correlate:'v.'};
test('79 meaning-specific bilingual rewrites preserve original source and are safe to repeat',()=>{
 const result=run(ROOT,{apply:false});
 assert.equal(result.total,79);
 assert.equal(result.edited+result.already,79);
 assert.equal(result.remaining_mechanical_in_target_tasks,0);
 assert.equal(result.tasks.length,3);
 assert.equal(result.accepted,0);
 assert.equal(result.installed,0);
 assert.equal(result.student_database_modified,false);
 assert.equal(frozen.entries.length,79);
 const unique=new Set();
 for(const p of frozen.entries){
  const id=p.task_id+':'+p.row_index;
  assert.equal(unique.has(id),false,id);
  unique.add(id);
  assert.ok(/[一-鿿]/.test(p.translation),id);
  assert.ok(p.example.toLowerCase().includes(p.word.toLowerCase()),id);
  const file=path.join(ROOT,'docs/model-task-results','worker-'+p.worker,p.task_id,'result.json');
  const row=JSON.parse(fs.readFileSync(file,'utf8')).entries[p.row_index];
  assert.deepEqual(row.original,p.original,id);
  assert.deepEqual(row.identity,p.identity,id);
  assert.equal(row.verification,'needs-review',id);
  assert.equal(row.external_human_review,false,id);
  assert.equal(row.full_dictionary_senses_reviewed,false,id);
  assert.ok([p.old_example,p.example].includes(row.proposed.example),id);
  if(row.proposed.example===p.example){
   assert.equal(row.proposed.example_translation,p.translation,id);
   assert.equal(row.draft_method,'editorial-context-rewrite-needs-review',id);
   assert.equal(row.proposed.pos,POS[p.word]||row.original.pos,id);
   if(POS[p.word]){
    assert.equal(row.selected_sense.pos,POS[p.word],id);
    assert.notEqual(row.original.pos,row.selected_sense.pos,id);
   }
  }
 }
});
test('full corpus retains 26612 bilingual pairs without installing draft material',()=>{
 const d=report(ROOT,{save:false});
 assert.equal(d.rows,26612);
 assert.equal(d.missing_pairs,0);
 assert.equal(d.approved,0);
 assert.equal(d.installed,0);
});
