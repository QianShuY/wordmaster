'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {materialize}=require('../scripts/persist-abc-reused-candidates');
const {plan}=require('../scripts/plan-next-model-review');
const ROOT=path.resolve(__dirname,'..');

function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'abc-materialize-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const entry={
  identity:{source_file:'cet6.txt',source_line:1,word:'resolve',
   source_raw:'resolve [rɪˈzɒlv] v.解决'},
  current:{pos:'v.',meaning:'解决',phonetic:'rɪˈzɒlv',
   example:'',example_translation:''},
 };
 const input={task_id:'cet6-001',entries:[entry]};
 const raw=JSON.stringify(input);
 const sha=crypto.createHash('sha256').update(raw).digest('hex');
 const inputDir=path.join(root,'docs/model-tasks-20261015/cet6');
 fs.mkdirSync(inputDir,{recursive:true});
 fs.writeFileSync(path.join(inputDir,'cet6-001.json'),raw);
 fs.writeFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),
  JSON.stringify({files:[{task_id:'cet6-001',file:'cet6/cet6-001.json',rows:1,sha256:sha}]}));
 const seed=path.join(root,'app/seed');
 fs.mkdirSync(seed,{recursive:true});
 fs.writeFileSync(path.join(seed,'examples-common-a-reviewed-20261014.json'),
 JSON.stringify({examples:[{
  source_file:'cet6.txt',source_line:1,word:'resolve',
  source_raw:entry.identity.source_raw,pos:'v.',meaning:'解决',
  text:'They resolved the problem.',translation:'他们解决了问题。',
  authorship:'moci-original',review_status:'sense-reviewed',
  reviewed_selected_meaning:'解决',
 }]}));
 return root;
}
test('persists exact-source row as an unapproved sidecar, not result.json',t=>{
 const root=fixture(t);
 const pre=materialize(root);
 assert.equal(pre.reused_example_candidate_rows,1);
 assert.equal(pre.new_sidecars,1);
 const applied=materialize(root,{apply:true});
 assert.equal(applied.new_sidecars,1);
 const file=path.join(root,'docs/model-task-results/worker-A/cet6-001/reused-candidates.json');
 const record=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(record.entries.length,1);
 assert.equal(record.entries[0].suggested.example,'They resolved the problem.');
 assert.equal(record.entries[0].verification,'needs-review');
 assert.equal(record.entries[0].authoritative_dictionary_sense_validation,false);
 assert.equal(record.entries[0].full_dictionary_senses_reviewed,false);
 assert.equal(record.entries[0].external_human_review,false);
 assert.equal(record.not_an_installed_or_accepted_vocabulary_result,true);
 assert.ok(!fs.existsSync(path.join(path.dirname(file),'result.json')));
 assert.equal(materialize(root,{apply:true}).new_sidecars,0,'idempotent');
});
test('never overwrite an existing candidate file, including a concurrently modified one',t=>{
 const root=fixture(t);
 const file=path.join(root,'docs/model-task-results/worker-A/cet6-001/reused-candidates.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,'{"concurrent":"edit"}\n');
 assert.throws(()=>materialize(root,{apply:true}),/no overwrite/);
 assert.equal(fs.readFileSync(file,'utf8'),'{"concurrent":"edit"}\n');
});
test('dry-run all-ABC persistence handles every old matched row without modifying the repository',()=>{
 const x=materialize(ROOT);
 assert.equal(x.input_source_rows,26612);
 assert.equal(x.existing_worker_draft_rows,plan(ROOT,{save:false}).all.result_rows);
 assert.ok(x.reused_example_candidate_rows>=0);
 assert.equal(x.reused_example_candidate_rows,x.by_worker.A+x.by_worker.B);
 assert.ok(x.by_worker.A>=0);
 assert.ok(x.by_worker.B>=0);
 assert.equal(x.approved,0);
 assert.equal(x.installed,0);
 assert.equal(x.no_source_result_or_learning_state_touched,true);
});
