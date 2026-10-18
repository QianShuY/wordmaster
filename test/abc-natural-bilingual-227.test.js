'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {main,FILES,counts}=require('../scripts/apply-abc-manual-natural-batches');
const {report}=require('../scripts/audit-abc-example-quality');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
test('227 individually authored bilingual pairs preserve exact original source and cannot auto approve',()=>{
 const status=main(ROOT,{apply:false});
 assert.equal(status.patch_rows,227);
 assert.equal(status.newly_fixed+status.already_fixed,227);
 assert.equal(status.remaining_offline_in_target_tasks,0);
 assert.equal(status.installed,0);
 assert.equal(status.approved,0);
 assert.equal(status.user_data_touched,false);
 assert.equal(status.task_files_changed,[...new Set(status.details.filter(d=>d.changed).map(d=>d.task))].length);
 for(const file of FILES){
  const patch=read(file);
  assert.equal(patch.entries.length,counts[patch.source]);
  const rows=read('docs/model-task-results/worker-A/'+patch.source+'/result.json').entries;
  for(const e of patch.entries){
   const row=rows[e.row_index];
   assert.deepEqual(row.identity,e.identity);
   assert.deepEqual(row.original,e.original);
   assert.equal(row.verification,'needs-review');
   assert.equal(row.external_human_review,false);
   assert.equal(row.full_dictionary_senses_reviewed,false);
   assert.ok(row.proposed.example.trim());
   assert.ok(/[一-鿿]/.test(row.proposed.example_translation));
   assert.ok(row.proposed.example===e.expected_example||row.proposed.example===e.example);
   if(row.proposed.example===e.example){
    assert.equal(row.proposed.example_translation,e.translation);
    assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
   }
  }
 }
});
test('quality audit counts every learner draft and never confuses draft coverage with acceptance',()=>{
 const stats=report(ROOT,{save:false});
 assert.equal(stats.rows,26612);
 assert.equal(stats.missing_pairs,0);
 assert.equal(stats.approved,0);
 assert.equal(stats.installed,0);
 assert.ok(stats.flagged_unique>=0);
 if(main(ROOT,{apply:false}).already_fixed===227){
  const special=require('../scripts/apply-abc-29-special-contexts').patch(ROOT,{apply:false});
  assert.ok(stats.by_method['editorial-context-rewrite-needs-review']>=286+special.already);
  assert.ok((stats.by_method['offline-context-first-draft']||0)+(stats.by_method['metalinguistic-placeholder']||0)<=3812+31-227-special.already);
 }
});
