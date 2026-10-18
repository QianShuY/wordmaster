'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
test('all 12 legacy template examples in CET4-030 are meaning-specific and provenance-safe',()=>{
 const entries=read('docs/model-quality-patches/cet4-030-natural-012.json').entries;
 const manifest=read('docs/model-tasks-20261015/manifest.json').files.find(x=>x.task_id==='cet4-030');
 const bytes=fs.readFileSync(path.join(ROOT,'docs/model-tasks-20261015',manifest.file));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
 const source=JSON.parse(bytes),result=read('docs/model-task-results/worker-A/cet4-030/result.json');
 assert.equal(entries.length,12);
 assert.equal(result.entries.filter(x=>x.draft_method==='offline-context-first-draft').length,0);
 const seen=new Set();
 for(const p of entries){
  assert.equal(seen.has(p.index),false);
  seen.add(p.index);
  const e=result.entries[p.index],old=source.entries[p.index];
  assert.deepEqual(e.identity,p.identity);
  assert.deepEqual(e.original,p.original);
  assert.deepEqual(old.identity,p.identity);
  assert.deepEqual(old.current,p.original);
  assert.equal(e.verification,'needs-review');
  assert.equal(e.external_human_review,false);
  assert.equal(e.full_dictionary_senses_reviewed,false);
  assert.equal(e.proposed.example,p.new_example);
  assert.equal(e.proposed.example_translation,p.new_translation);
  assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');
  if(p.new_pos){
   assert.equal(e.original.pos,'n.');
   assert.equal(e.selected_sense.pos,p.new_pos);
   assert.equal(e.proposed.pos,p.new_pos);
  }
 }
});
