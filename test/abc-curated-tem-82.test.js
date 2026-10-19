'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const meta=read('docs/model-tasks-20261015/manifest.json').files.find(m=>m.task_id==='tem-003');
const patch=read('docs/model-quality-patches/curated-tem-003-082.json');
const actual=read('docs/model-task-results/worker-A/tem-003/result.json');
test('all 82 TEM bilingual natural usage replacements are source-bound, unapproved and complete',()=>{
 assert.equal(patch.entries.length,82);
 assert.equal(patch.approved,false);
 assert.equal(patch.independent_dictionary_review,false);
 const sourceFile=path.join(root,'docs/model-tasks-20261015',meta.file);
 const bytes=fs.readFileSync(sourceFile);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256);
 const original=JSON.parse(bytes);
 assert.equal(actual.task_id,'tem-003');
 assert.equal(actual.input_sha256,meta.sha256);
 assert.equal(actual.entries.length,100);
 assert.equal(actual.entries.filter(e=>e.draft_method==='offline-context-first-draft').length,0);
 const seen=new Set();
 for(const p of patch.entries){
  assert.equal(seen.has(p.row_index),false,'duplicate patch index');
  seen.add(p.row_index);
  const row=actual.entries[p.row_index],src=original.entries[p.row_index];
  assert.deepEqual(row.identity,src.identity);
  assert.deepEqual(row.original,src.current);
  assert.deepEqual(row.identity,p.identity);
  assert.deepEqual(row.original,p.original);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(row.proposed.example,p.example);
  assert.equal(row.proposed.example_translation,p.translation);
  assert.ok(/[一-鿿]/.test(row.proposed.example_translation));
  assert.ok(row.proposed.example.toLowerCase().includes(p.word.toLowerCase()));
  if(p.updated_pos){
   assert.equal(row.selected_sense.pos,p.updated_pos);
   assert.equal(row.proposed.pos,p.updated_pos);
   assert.notEqual(row.original.pos,p.updated_pos);
  }
 }
});
