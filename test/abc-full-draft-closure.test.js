'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const {plan}=require('../scripts/plan-next-model-review');
const {inspect}=require('../scripts/audit-model-evidence');
const {complete,priorMissing}=require('../scripts/complete-abc-all');
const {make,hasHeadword}=require('../scripts/abc-offline-draft');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const sum=x=>x.reduce((s,r)=>s+r.rows,0);
test('offline draft produces a bilingual editable example with source word and honest risk flags',()=>{
 const examples=[
  {identity:{word:'engine'},current:{pos:'n.',meaning:'发动机'}},
  {identity:{word:'modify'},current:{pos:'vt.',meaning:'修改'}},
  {identity:{word:'rapid'},current:{pos:'a.',meaning:'快速的'}},
  {identity:{word:'rapidly'},current:{pos:'ad.',meaning:'迅速地'}},
  {headword:'forty',candidates:[{pos:'num.',meaning:'四十'}]},
  {identity:{word:'however'},current:{pos:'conj.',meaning:'然而'}},
 ];
 for(const x of examples){
  const word=x.identity?.word||x.headword;
  const result=make(x,x.identity??null);
  assert.ok(hasHeadword(result.example,word),word);
  assert.ok(/[\u3400-\u9fff]/.test(result.example_translation),word);
  assert.ok(result.issues.length>=2,word);
  assert.ok(!result.authoritative_dictionary_sense_validation,word);
 }
 assert.equal(hasHeadword('A priority was assigned to the case.','prior'),false);
 assert.equal(hasHeadword('The children played outside.','play'),true);
});
test('full corpus has exact source-aligned proposals or one-shot plan to fill all pending rows',()=>{
 const p=plan(ROOT,{save:false});
 assert.equal(sum(manifest.files),26612);
 assert.equal(p.all.result_rows+p.all.rows_not_yet_drafted,26612);
 assert.equal(p.acceptance.accepted,0);
 assert.equal(p.acceptance.installed,0);
 if(p.all.rows_not_yet_drafted>0){
  const dry=complete(ROOT,{apply:false});
  assert.equal(dry.expected_total,26612);
  assert.equal(dry.expected_missing,0);
  assert.equal(dry.created_rows,p.all.rows_not_yet_drafted);
  assert.equal(dry.existing_blanks_completed,Object.keys(priorMissing).length);
  assert.equal(dry.accepted,0);
  assert.equal(dry.installed,0);
  assert.equal(dry.committed_to_local_worktree,false);
  assert.ok(dry.offline_context_drafts+dry.metalinguistic_placeholders>0);
 }else{
  const a=inspect(ROOT,{save:false});
  assert.equal(a.totals.assigned_rows,26612);
  assert.equal(a.totals.actual_proposal_rows,26612);
  assert.equal(a.totals.example_pairs_missing,0);
  assert.equal(a.totals.result_files,manifest.files.length);
  assert.equal(a.totals.primary_accepted_rows,0);
  assert.equal(a.totals.installed_rows,0);
  assert.equal(a.findings.filter(x=>/identity-reordered|original-field-altered|manifest-input-sha-mismatch|progress/.test(x.code)).length,0);
 }
});
