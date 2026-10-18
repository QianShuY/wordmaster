'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const patch=read('docs/model-quality-patches/crossbook-exact-sense-002.json');
const manifest=read('docs/model-tasks-20261015/manifest.json');
test('two corrected TEM candidates preserve source identity and remain unapproved',()=>{
 assert.equal(patch.approved,false);
 assert.equal(patch.entries.length,2);
 for(const edit of patch.entries){
  const meta=manifest.files.find(m=>m.task_id===edit.task_id);
  assert.ok(meta);
  const bytes=fs.readFileSync(path.join(ROOT,'docs/model-tasks-20261015',meta.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256);
  const orig=JSON.parse(bytes).entries[edit.row_index];
  const proposal=read('docs/model-task-results/worker-'+edit.worker+'/'+edit.task_id+'/result.json');
  const row=proposal.entries[edit.row_index];
  assert.equal(proposal.input_sha256,meta.sha256);
  assert.deepEqual(row.identity,orig.identity);
  assert.deepEqual(row.original,orig.current);
  assert.deepEqual(row.identity,edit.identity);
  assert.deepEqual(row.original,edit.original);
  assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  assert.equal(row.proposed.example,edit.new_example);
  assert.equal(row.proposed.example_translation,edit.new_translation);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
 }
});
