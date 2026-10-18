'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const patch=read('docs/model-quality-patches/crossbook-sense-corrections-015.json');
const manifest=new Map(read('docs/model-tasks-20261015/manifest.json').files.map(f=>[f.task_id,f]));
test('15 high-confidence crossbook source-sense edits preserve frozen identity, data and unapproved state',()=>{
 assert.equal(patch.entries.length,15);
 assert.equal(patch.approved,false);
 assert.equal(patch.independent_dictionary_review,false);
 const seen=new Set(),cache=new Map();
 for(const p of patch.entries){
  const key=p.task_id+':'+p.row_index;
  assert.equal(seen.has(key),false,key);
  seen.add(key);
  const meta=manifest.get(p.task_id);
  assert.ok(meta,key);
  if(!cache.has(p.task_id)){
   const inputFile=path.join(ROOT,'docs/model-tasks-20261015',meta.file),input=fs.readFileSync(inputFile);
   assert.equal(crypto.createHash('sha256').update(input).digest('hex'),meta.sha256);
   cache.set(p.task_id,{input:JSON.parse(input),output:read('docs/model-task-results/worker-'+p.worker+'/'+p.task_id+'/result.json')});
  }
  const {input,output}=cache.get(p.task_id),src=input.entries[p.row_index],row=output.entries[p.row_index];
  assert.equal(output.input_sha256,meta.sha256);
  assert.deepEqual(row.identity,src.identity);
  assert.deepEqual(row.original,src.current);
  assert.deepEqual(row.identity,p.identity);
  assert.deepEqual(row.original,p.original);
  assert.equal(row.proposed.example,p.new_example);
  assert.equal(row.proposed.example_translation,p.new_translation);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.ok(row.proposed.example.toLowerCase().includes(p.word.toLowerCase()),key);
  assert.ok(/[\u3400-\u9fff]/.test(row.proposed.example_translation),key);
 }
 assert.equal(cache.size,6);
});
