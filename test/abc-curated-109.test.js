'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const files=[
 'docs/model-quality-patches/curated-cet4-cet6-073-20261018.json',
 'docs/model-quality-patches/curated-cet4-cet6-036-20261018.json'
];
const manifest=read('docs/model-tasks-20261015/manifest.json');
test('109 new contextual bilingual examples are bound to immutable source identities and remain unapproved',()=>{
 const patches=files.flatMap(f=>{
  const x=read(f);
  assert.equal(x.approved,false);
  assert.equal(x.independent_dictionary_review,false);
  return x.entries;
 });
 assert.equal(patches.length,109);
 const seen=new Set(),tasks=new Map();
 for(const edit of patches){
  const key=edit.task_id+':'+edit.row_index;
  assert.ok(!seen.has(key),'no duplicated patch '+key);
  seen.add(key);
  assert.equal(edit.worker,'A');
  assert.ok(edit.example.includes(edit.word)||edit.example.toLowerCase().includes(edit.word.toLowerCase()));
  assert.ok(/[一-鿿]/.test(edit.translation));
  if(!tasks.has(edit.task_id)){
   const m=manifest.files.find(x=>x.task_id===edit.task_id);
   assert.ok(m,'missing manifest '+edit.task_id);
   const bytes=fs.readFileSync(path.join(root,'docs/model-tasks-20261015',m.file));
   assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);
   const src=JSON.parse(bytes),result=read('docs/model-task-results/worker-A/'+edit.task_id+'/result.json');
   assert.equal(result.input_sha256,m.sha256);
   assert.equal(result.entries.length,m.rows);
   assert.equal(result.entries.filter(r=>r.draft_method==='offline-context-first-draft').length,0);
   tasks.set(edit.task_id,{src,result});
  }
  const {src,result}=tasks.get(edit.task_id);
  const before=src.entries[edit.row_index],now=result.entries[edit.row_index];
  assert.deepEqual(now.identity,edit.identity,key);
  assert.deepEqual(now.original,edit.original,key);
  assert.deepEqual(before.identity,edit.identity,key);
  assert.deepEqual(before.current,edit.original,key);
  assert.equal(now.verification,'needs-review',key);
  assert.equal(now.external_human_review,false,key);
  assert.equal(now.full_dictionary_senses_reviewed,false,key);
  assert.equal(now.draft_method,'editorial-context-rewrite-needs-review',key);
  assert.equal(now.proposed.example,edit.example,key);
  assert.equal(now.proposed.example_translation,edit.translation,key);
  if(edit.updated_pos){
   assert.equal(now.selected_sense.pos,edit.updated_pos,key);
   assert.equal(now.proposed.pos,edit.updated_pos,key);
   assert.notEqual(now.original.pos,edit.updated_pos,key);
  }
 }
 assert.equal(tasks.size,8);
});
test('full corpus continues to have every entry bilingual and zero installed drafts',()=>{
 const {report}=require('../scripts/audit-abc-example-quality');
 const x=report(root,{save:false});
 assert.equal(x.rows,26612);
 assert.equal(x.missing_pairs,0);
 assert.equal(x.installed,0);
 assert.equal(x.approved,0);
});
