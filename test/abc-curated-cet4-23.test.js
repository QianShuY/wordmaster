'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const patch=read('docs/model-quality-patches/curated-cet4-031-032-023.json');
const manifest=read('docs/model-tasks-20261015/manifest.json');
test('23 contextual CET4 examples replace all generic rows without modifying frozen source',()=>{
 assert.equal(patch.entries.length,23);
 assert.equal(patch.approved,false);
 const cache=new Map(),seen=new Set();
 for(const e of patch.entries){
  const key=e.task_id+':'+e.row_index;
  assert.equal(seen.has(key),false);
  seen.add(key);
  const m=manifest.files.find(x=>x.task_id===e.task_id),root=path.join(ROOT,'docs/model-tasks-20261015',m.file);
  const bytes=fs.readFileSync(root);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);
  if(!cache.has(e.task_id)){
   const proposal=read('docs/model-task-results/worker-A/'+e.task_id+'/result.json');
   cache.set(e.task_id,{original:JSON.parse(bytes),proposal});
   assert.equal(proposal.entries.filter(x=>x.draft_method==='offline-context-first-draft').length,0);
  }
  const {original,proposal}=cache.get(e.task_id),src=original.entries[e.row_index],row=proposal.entries[e.row_index];
  assert.deepEqual(row.original,src.current);
  assert.deepEqual(row.identity,src.identity);
  assert.deepEqual(row.identity,e.identity);
  assert.deepEqual(row.original,e.original);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(row.proposed.example,e.example);
  assert.equal(row.proposed.example_translation,e.translation);
  assert.ok(/[一-鿿]/.test(e.translation));
  if(e.changed_pos){
   assert.equal(row.selected_sense.pos,e.changed_pos);
   assert.equal(row.proposed.pos,e.changed_pos);
   assert.notEqual(row.original.pos,e.changed_pos);
  }
 }
 assert.equal(cache.size,2);
});
