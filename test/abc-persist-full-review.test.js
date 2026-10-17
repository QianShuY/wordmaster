'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto');
const {prepare}=require('../scripts/persist-abc-full-review-material');
const ROOT=path.resolve(__dirname,'..');
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'abc-full-material-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const source={task_id:'cet4-001',entries:[
    {identity:{source_file:'cet4.txt',source_line:1,word:'start',
      source_raw:'start [stɑːt] v.开始'},
      current:{pos:'v.',meaning:'开始',phonetic:'stɑːt',example:'',example_translation:''}},
    {identity:{source_file:'cet4.txt',source_line:2,word:'finish',
      source_raw:'finish [ˈfɪnɪʃ] v.完成'},
      current:{pos:'v.',meaning:'完成',phonetic:'ˈfɪnɪʃ',example:'',example_translation:''}}
  ]};
  const bytes=Buffer.from(JSON.stringify(source));
  const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  const folder=path.join(root,'docs/model-tasks-20261015/cet4');
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'cet4-001.json'),bytes);
  fs.writeFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),
    JSON.stringify({files:[{task_id:'cet4-001',file:'cet4/cet4-001.json',rows:2,sha256}]}));
  return root;
}
test('source ledger persists only separate unapproved materials, preserves worker data and is idempotent',t=>{
 const root=fixture(t);
 const pre=prepare(root,{apply:false});
 assert.equal(pre.remaining_to_author_or_source,2);
 assert.equal(pre.task_sidecars,1);
 assert.equal(pre.rows_requiring_new_original_example,2);
 assert.equal(pre.rows_with_any_bilingual_candidate,0);
 assert.equal(pre.new_sidecars,1);
 const file=path.join(root,'docs/model-task-results/worker-A/cet4-001/remaining-review-material.json');
 assert.equal(fs.existsSync(file),false);
 const applied=prepare(root,{apply:true});
 assert.equal(applied.new_sidecars,1);
 const doc=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.equal(doc.input_sha256,
  JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'))).files[0].sha256);
 assert.equal(doc.results_are_not_approved_or_installed,true);
 assert.equal(doc.entries.length,2);
 assert.deepEqual(doc.entries.map(x=>x.status),[
  'new-original-example-required','new-original-example-required'
 ]);
 assert.ok(doc.entries.every(x=>x.verification==='needs-review'
   && x.human_approved===false&&x.full_dictionary_senses_reviewed===false));
 assert.equal(fs.existsSync(path.join(path.dirname(file),'result.json')),false);
 assert.equal(prepare(root,{apply:true}).new_sidecars,0);
});
test('refuses to overwrite a concurrent reviewer edit',t=>{
 const root=fixture(t);
 const file=path.join(root,'docs/model-task-results/worker-A/cet4-001/remaining-review-material.json');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,'{\"reviewer\":\"touched\"}\n');
 assert.equal(prepare(root,{apply:false}).stale_existing_sidecars,1,'dry run only reports snapshot drift');
 assert.throws(()=>prepare(root,{apply:true}),/refuse overwrite/);
 assert.equal(fs.readFileSync(file,'utf8'),'{\"reviewer\":\"touched\"}\n');
});
test('full repository review queue covers every undrafted row and approves none',()=>{
 const report=prepare(ROOT,{apply:false});
 assert.equal(report.total_source_rows,26612);
 assert.equal(report.existing_worker_drafts+report.remaining_to_author_or_source,26612);
 assert.equal(report.rows_with_any_bilingual_candidate+report.rows_requiring_new_original_example,
  report.remaining_to_author_or_source);
 assert.ok(report.rows_with_any_bilingual_candidate>0);
 assert.ok(report.task_sidecars>0);
 assert.equal(report.approved,0);
 assert.equal(report.installed,0);
 assert.equal(report.independent_dictionary_reviews_performed,0);
});
