'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const patch=JSON.parse(fs.readFileSync(path.join(ROOT,
 'docs/model-quality-patches/semantic-hotfix-007-20261018.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const meta=new Map(manifest.files.map(x=>[x.task_id,x]));
test('seven selected-sense fixes retain immutable original source and unapproved status',()=>{
 assert.equal(patch.entries.length,7);
 assert.equal(patch.approved,false);
 for(const p of patch.entries){
  const m=meta.get(p.task_id);
  assert.ok(m);
  const bytes=fs.readFileSync(path.join(ROOT,'docs/model-tasks-20261015',m.file));
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,m.sha256,'source SHA unchanged');
  const original=JSON.parse(bytes).entries[p.row_index];
  const file=path.join(ROOT,'docs/model-task-results','worker-'+p.worker,p.task_id,'result.json');
  const result=JSON.parse(fs.readFileSync(file,'utf8'));
  const row=result.entries[p.row_index];
  assert.deepEqual(row.original,p.original);
  assert.deepEqual(row.identity,p.identity);
  assert.deepEqual(row.identity,original.identity);
  assert.deepEqual(row.original,original.current);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.equal(row.proposed.example,p.after_example);
  assert.equal(row.proposed.example_translation,p.after_translation);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.match(row.proposed.example,new RegExp(p.word,'i'));
  assert.ok(/[一-鿿]/.test(row.proposed.example_translation));
 }
});
