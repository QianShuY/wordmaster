'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const patch=read('docs/model-quality-patches/cet4-crossbook-sense-hotfix-005.json');
const m=read('docs/model-tasks-20261015/manifest.json').files.find(x=>x.task_id==='cet4-030');
test('five CET4 meaning/POS repairs preserve frozen original source and are not auto-approved',()=>{
 assert.equal(patch.approved,false);
 assert.equal(patch.entries.length,5);
 const sourceFile=path.join(ROOT,'docs/model-tasks-20261015',m.file);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(sourceFile)).digest('hex'),m.sha256);
 const original=read(path.relative(ROOT,sourceFile));
 const result=read('docs/model-task-results/worker-A/cet4-030/result.json');
 assert.equal(result.input_sha256,m.sha256);
 const seen=new Set();
 for(const p of patch.entries){
  assert.equal(seen.has(p.index),false);
  seen.add(p.index);
  const row=result.entries[p.index],source=original.entries[p.index];
  assert.equal(row.identity.word,p.word);
  assert.deepEqual(row.identity,p.identity);
  assert.deepEqual(row.original,p.original);
  assert.deepEqual(source.identity,p.identity);
  assert.deepEqual(source.current,p.original);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.equal(row.proposed.example,p.after_example);
  assert.equal(row.proposed.example_translation,p.after_translation);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.ok(row.proposed.example.toLowerCase().includes(p.word.toLowerCase()));
  if(p.candidate_pos){
   assert.equal(row.selected_sense.pos,p.candidate_pos);
   assert.equal(row.proposed.pos,p.candidate_pos);
   assert.notEqual(row.original.pos,p.candidate_pos);
  }
 }
});
