'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const patch=read('docs/model-quality-patches/curated-cet4-cet6-049.json'),manifest=read('docs/model-tasks-20261015/manifest.json');
test('all 49 additional CET4/CET6 rewrites are source bound and unapproved',()=>{
 assert.equal(patch.approved,false);
 assert.equal(patch.entries.length,49);
 const checked=new Set(),tasks=new Set();
 for(const edit of patch.entries){
  const key=edit.task_id+':'+edit.row_index;
  assert.equal(checked.has(key),false);
  checked.add(key);tasks.add(edit.task_id);
  const meta=manifest.files.find(m=>m.task_id===edit.task_id),name=path.join(ROOT,'docs/model-tasks-20261015',meta.file),buf=fs.readFileSync(name);
  assert.equal(crypto.createHash('sha256').update(buf).digest('hex'),meta.sha256);
  const orig=JSON.parse(buf).entries[edit.row_index],result=read('docs/model-task-results/worker-'+edit.worker+'/'+edit.task_id+'/result.json').entries[edit.row_index];
  assert.deepEqual(result.original,orig.current);
  assert.deepEqual(result.identity,orig.identity);
  assert.deepEqual(result.original,edit.original);
  assert.deepEqual(result.identity,edit.identity);
  assert.equal(result.verification,'needs-review');
  assert.equal(result.external_human_review,false);
  assert.equal(result.full_dictionary_senses_reviewed,false);
  assert.equal(result.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(result.proposed.example,edit.example);
  assert.equal(result.proposed.example_translation,edit.translation);
  assert.ok(/[一-鿿]/.test(result.proposed.example_translation));
 }
 assert.equal(tasks.size,3);
 for(const task of tasks){
  const a=read('docs/model-task-results/worker-A/'+task+'/result.json');
  assert.equal(a.entries.filter(e=>e.draft_method==='offline-context-first-draft').length,0);
 }
});
