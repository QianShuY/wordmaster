'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {run}=require('../scripts/apply-abc-quality-patches');
const {report}=require('../scripts/audit-abc-example-quality');
const data=JSON.parse(fs.readFileSync(path.join(ROOT,
 'docs/model-quality-patches/quality-targeted-examples-20261018.json'),'utf8'));
test('source-bound 59 bilingual repairs are a safe dry run or a committed unapproved set',()=>{
 assert.equal(data.entries.length,59);
 const summary=run(ROOT,{apply:false});
 assert.equal(summary.proposed_edits,59);
 assert.equal(summary.newly_rewritten+summary.already_applied,59);
 assert.equal(summary.preserved_source,59);
 assert.equal(summary.installed,0);
 assert.equal(summary.approved,0);
 assert.equal(summary.modified_learning_data,false);
 assert.equal(summary.tasks.length,3);
 const group=new Map();
 for(const edit of data.entries){
  const key=edit.worker+'/'+edit.task_id;
  if(!group.has(key))group.set(key,JSON.parse(fs.readFileSync(path.join(ROOT,
   'docs/model-task-results','worker-'+edit.worker,edit.task_id,'result.json'),'utf8')));
  const row=group.get(key).entries[edit.row_index];
  assert.deepEqual(row.identity,edit.identity);
  assert.deepEqual(row.original,edit.original);
  assert.equal(row.verification,'needs-review');
  assert.equal(row.external_human_review,false);
  assert.equal(row.full_dictionary_senses_reviewed,false);
  assert.notEqual(row.proposed.phonetic==='fake','never fill invented IPA');
  assert.ok(row.proposed.example===edit.before_example||row.proposed.example===edit.after_example);
  if(row.proposed.example===edit.after_example){
   assert.equal(row.proposed.example_translation,edit.after_translation);
   assert.equal(row.draft_method,'editorial-context-rewrite-needs-review');
  }
 }
});
test('known incorrect noun/adjective and adjective/adverb source marks are flagged without rewriting origin',()=>{
 const x=data.entries.find(e=>e.task_id==='cet4-024'&&e.identity.word==='reception');
 const y=data.entries.find(e=>e.task_id==='cet4-025'&&e.identity.word==='respective');
 assert.equal(x.original.pos,'a.');
 assert.equal(y.original.pos,'ad.');
 assert.match(x.editorial_note,/名词/);
 assert.match(y.editorial_note,/形容词/);
});
test('full first-draft quality triage has zero empty pairs and never asserts verified senses',()=>{
 const x=report(ROOT,{save:false});
 assert.equal(x.rows,26612);
 assert.equal(x.missing_pairs,0);
 assert.equal(x.installed,0);
 assert.equal(x.approved,0);
 assert.equal(x.independent_verified_dictionary_senses,0);
 assert.ok(x.by_method['crossbook-sense-unverified']>0);
 assert.ok(x.flagged_unique>0);
 assert.ok(x.automatic_review_flags['generic-verb-template']>0);
 assert.ok(x.examples.every(e=>Array.isArray(e.flags)&&e.flags.length));
});
