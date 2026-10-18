'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {generate,posType}=require('../scripts/reuse-abc-local-examples');
const root=path.resolve(__dirname,'..');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'moci-reuse-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const inp={task_id:'cet4-001',entries:[
  {identity:{source_file:'cet4.txt',source_line:1,word:'red',source_raw:'red [rɛd] a.红色的'},
   current:{pos:'a.',meaning:'红色的',phonetic:'rɛd',example:'',example_translation:''}},
  {identity:{source_file:'cet4.txt',source_line:2,word:'red',source_raw:'red [rɛd] n.红色'},
   current:{pos:'n.',meaning:'红色',phonetic:'rɛd',example:'',example_translation:''}},
 ]};
 const contents=Buffer.from(JSON.stringify(inp));
 const sha=crypto.createHash('sha256').update(contents).digest('hex');
 const dir=path.join(root,'docs/model-tasks-20261015/cet4');
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'cet4-001.json'),contents);
 fs.writeFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),
  JSON.stringify({files:[{task_id:'cet4-001',file:'cet4/cet4-001.json',rows:2,sha256:sha}]}));
 const seed=path.join(root,'app/seed');
 fs.mkdirSync(seed,{recursive:true});
 fs.writeFileSync(path.join(seed,'examples-common-a-reviewed-20261014.json'),JSON.stringify({examples:[
  {source_file:'cet4.txt',source_line:1,word:'red',
    source_raw:'red [rɛd] a.红色的',pos:'a.',meaning:'红色的',
    review_status:'sense-reviewed',authorship:'moci-original',
    text:'This flower is red.',translation:'这朵花是红色的。'},
  {source_file:'cet4.txt',source_line:2,word:'red',
    source_raw:'red [rɛd] n.红色',pos:'n.',meaning:'红色',
    review_status:'sense-reviewed',authorship:'moci-original',
    text:'I prefer red.',translation:'我更喜欢红色。'},
 ]}));
 return {root,sha};
}
test('matches examples by full source location and original POS, not just the same headword',t=>{
 const {root}=fixture(t),out=generate(root,{save:false});
 assert.equal(out.summary.candidates_available,2);
 assert.deepEqual(out.candidates.map(c=>c.suggested.example),[
  'This flower is red.','I prefer red.',
 ]);
 assert.ok(out.candidates.every(x=>x.verification==='needs-review'
  && x.external_human_review===false && x.full_dictionary_senses_reviewed===false));
});
test('rejects ambiguous identity candidates without choosing arbitrary newest source',t=>{
 const {root}=fixture(t);
 const file=path.join(root,'app/seed/examples-extended-reviewed-20261014.json');
 fs.writeFileSync(file,JSON.stringify({examples:[{
  source_file:'cet4.txt',source_line:1,word:'red',source_raw:'red [rɛd] a.红色的',
  pos:'a.',meaning:'红色的',review_status:'sense-reviewed',authorship:'moci-original',
  text:'The car is red.',translation:'那辆车是红色的。',
 }]}));
 const out=generate(root,{save:false});
 assert.equal(out.summary.candidates_available,1);
 assert.equal(out.summary.ambiguous_rows_skipped,1);
 assert.equal(out.conflicts[0].headword,'red');
});
test('preserves prior result prefix, only recovers remaining rows',t=>{
 const {root,sha}=fixture(t);
 const parent=path.join(root,'docs/model-task-results/worker-A/cet4-001');
 fs.mkdirSync(parent,{recursive:true});
 const original=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/cet4/cet4-001.json')));
 const result={task_id:'cet4-001',input_sha256:sha,status:'proposal',entries:[{
  identity:original.entries[0].identity,original:original.entries[0].current,
  proposed:{example:'Another example.',example_translation:'另一个例句。'},verification:'needs-review',
 }]};
 fs.writeFileSync(path.join(parent,'result.json'),JSON.stringify(result));
 const originalBytes=fs.readFileSync(path.join(parent,'result.json'));
 const out=generate(root,{save:true,outputDir:path.join(root,'output/refinement/abc-bulk')});
 assert.equal(out.summary.previously_drafted_rows,1);
 assert.equal(out.summary.candidates_available,1);
 assert.equal(out.candidates[0].row_index,1);
 assert.equal(out.candidates[0].suggested.example,'I prefer red.');
 assert.deepEqual(fs.readFileSync(path.join(parent,'result.json')),originalBytes);
});
test('blocks tampered historical row without writing candidate files',t=>{
 const {root,sha}=fixture(t);
 const parent=path.join(root,'docs/model-task-results/worker-A/cet4-001');
 fs.mkdirSync(parent,{recursive:true});
 const entry=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/cet4/cet4-001.json'))).entries[0];
 fs.writeFileSync(path.join(parent,'result.json'),JSON.stringify({
  task_id:'cet4-001',input_sha256:sha,status:'proposal',
  entries:[{identity:{...entry.identity,word:'corrupted'},original:entry.current}],
 }));
 const dest=path.join(root,'output/refinement/abc-bulk');
 assert.throws(()=>generate(root,{outputDir:dest}),/identity\/original mismatch/);
 assert.equal(fs.existsSync(dest),false);
});
test('recognizes common POS aliases without trusting unknown POS',()=>{
 assert.equal(posType('n.'),'noun');
 assert.equal(posType('a.'),'adjective');
 assert.equal(posType('adj.'),'adjective');
 assert.equal(posType('vi.'),'verb');
 assert.equal(posType('v.'),'verb');
 assert.equal(posType('vt.'),'verb');
 assert.equal(posType('ad.'),'adverb');
 assert.equal(posType('v. n.'),null);
});
test('complete repository reuse count is bounded by real pending source rows',()=>{
 const out=generate(root,{save:false});
 assert.equal(out.summary.input_rows,26612);
 assert.equal(out.summary.previously_drafted_rows+out.summary.candidates_available+
  out.summary.still_missing_candidate,26612);
 assert.ok(out.summary.candidates_available>=0,'all-drafted means no remaining candidates');
 assert.equal(out.summary.accepted,0);
 assert.equal(out.summary.installed,0);
 assert.ok(out.candidates.every(x=>x.suggested.example&&x.suggested.example_translation));
});
