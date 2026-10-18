'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const {run}=require('../scripts/apply-abc-curated-80');
const edits=read('docs/model-quality-patches/curated-cet6-004-005-080.json').entries;
const manifest=read('docs/model-tasks-20261015/manifest.json');
test('all 80 meaning-focused CET6 replacement pairs are exact-source locked',()=>{
 const status=run(ROOT,{apply:false});
 assert.equal(status.total,80);
 assert.equal(status.edited+status.already,80);
 assert.equal(status.remaining_mechanical_in_target_tasks,0);
 assert.equal(status.accepted,0);
 assert.equal(status.installed,0);
 assert.equal(status.student_database_modified,false);
 assert.equal(status.tasks.length,2);
 assert.equal(edits.length,80);
 const seen=new Set();
 for(const edit of edits){
  const key=edit.task_id+':'+edit.row_index;
  assert.equal(seen.has(key),false,key);
  seen.add(key);
  assert.ok(/[一-鿿]/.test(edit.translation),key);
  assert.ok(edit.example.toLowerCase().includes(edit.word.toLowerCase()),key);
  const m=manifest.files.find(f=>f.task_id===edit.task_id);
  const bytes=fs.readFileSync(path.join(ROOT,'docs/model-tasks-20261015',m.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);
  const source=JSON.parse(bytes).entries[edit.row_index];
  const result=read('docs/model-task-results/worker-A/'+edit.task_id+'/result.json').entries[edit.row_index];
  assert.deepEqual(result.identity,source.identity);
  assert.deepEqual(result.original,source.current);
  assert.deepEqual(result.identity,edit.identity);
  assert.deepEqual(result.original,edit.original);
  assert.equal(result.verification,'needs-review');
  assert.equal(result.external_human_review,false);
  assert.equal(result.full_dictionary_senses_reviewed,false);
  assert.equal(result.proposed.example,edit.example);
  assert.equal(result.proposed.example_translation,edit.translation);
  assert.equal(result.draft_method,'editorial-context-rewrite-needs-review');
  if(edit.changed_pos){
   assert.equal(result.selected_sense.pos,edit.changed_pos);
   assert.equal(result.proposed.pos,edit.changed_pos);
   assert.notEqual(result.original.pos,edit.changed_pos);
  }
 }
 for(const task of ['cet6-004','cet6-005']){
  const rows=read('docs/model-task-results/worker-A/'+task+'/result.json').entries;
  assert.equal(rows.filter(e=>e.draft_method==='offline-context-first-draft').length,0);
 }
});
