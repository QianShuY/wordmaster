'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {candidates}=require('../scripts/transfer-abc-crossbook-examples');
const {plan}=require('../scripts/plan-next-model-review');
const repoRoot=path.resolve(__dirname,'..');
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'moci-crossbook-'));
  t.after(()=>fs.rmSync(root,{force:true,recursive:true}));
  const tasks=[
    {task_id:'cet4-001',file:'cet4/cet4-001.json',entries:[
      ['bank','n.','河岸',null],['run','v.','奔跑',null],
      ['light','a.','明亮的',null],['lead','n.','铅',2]],
      source_file:'cet4.txt'},
    {task_id:'npee-001',file:'npee/npee-001.json',entries:[
      ['bank','n.','银行',null],['run','v.','经营',null],
      ['light','n.','光',null],['lead','n.','带头作用',1]],
      source_file:'npee.txt'},
  ];
  const mf=[];
  for(const task of tasks) {
    const [group]=task.file.split('/');
    const inp={task_id:task.task_id,entries:task.entries.map(([word,pos,meaning,homograph],i)=>({
      identity:{source_file:task.source_file,source_line:i+1,word,
        headword:word,homograph,source_raw:word+' '+pos+meaning},
      current:{pos,meaning,phonetic:'?',example:'',example_translation:''},
    }))};
    const dir=path.join(root,'docs/model-tasks-20261015',group);
    fs.mkdirSync(dir,{recursive:true});
    const content=JSON.stringify(inp);
    fs.writeFileSync(path.join(dir,task.task_id+'.json'),content);
    const sha256=createHash('sha256').update(content).digest('hex');
    mf.push({task_id:task.task_id,file:task.file,rows:4,sha256});
    if(task.task_id==='npee-001') {
      const output=path.join(root,'docs/model-task-results/worker-B/npee-001');
      fs.mkdirSync(output,{recursive:true});
      fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({
        task_id:task.task_id,input_sha256:sha256,status:'proposal',
        entries:inp.entries.map((e,i)=>({
          identity:e.identity,original:e.current,selected_sense:{pos:e.current.pos,
            meaning:['n. financial bank','v. run a business','n. brightness','n. leading'][i]},
          proposed:{example:['I visited the bank.','She runs a cafe.',
            'The light was bright.','They took the lead.'][i],
            example_translation:['我去了银行。','她经营一家咖啡馆。',
              '灯光很亮。','他们带头行动。'][i]},
          verification:'needs-review',
        })),
      }));
    }
  }
  const inDir=path.join(root,'docs/model-tasks-20261015');
  fs.writeFileSync(path.join(inDir,'manifest.json'),JSON.stringify({files:mf}));
  return root;
}
test('crossbook yields review options but never considers spelling and POS a semantic approval',t=>{
  const root=fixture(t);
  const out=candidates(root,{save:false});
  assert.equal(out.summary.input_rows,8);
  assert.equal(out.summary.rows_without_worker_proposal,4);
  assert.equal(out.summary.matching_rows,2);
  assert.equal(out.summary.unmatched_rows,2);
  assert.equal(out.summary.accepted,0);
  assert.equal(out.summary.installed,0);
  const bank=out.matched.find(x=>x.headword==='bank');
  assert.equal(bank.original.meaning,'河岸');
  assert.equal(bank.options[0].original_meaning,'银行');
  assert.ok(bank.risk_flags.includes('same-spelling-and-POS-not-equal-sense'));
  assert.equal(bank.decision,'review-required-not-installed');
  assert.ok(!out.matched.some(x=>x.headword==='light'),'noun vs adjective');
  assert.ok(!out.matched.some(x=>x.headword==='lead'),'numbered homographs');
});
test('crossbook never edits worker proposals or creates student database',t=>{
  const root=fixture(t);
  const f=path.join(root,'docs/model-task-results/worker-B/npee-001/result.json');
  const before=fs.readFileSync(f);
  const outDir=path.join(root,'output/refinement/abc-bulk');
  const out=candidates(root,{outputDir:outDir});
  assert.deepEqual(fs.readFileSync(f),before);
  assert.equal(out.summary.matching_rows,2);
  assert.ok(fs.existsSync(path.join(outDir,'crossbook-options.json')));
  assert.ok(fs.existsSync(path.join(outDir,'crossbook-summary.json')));
});
test('crossbook aborts if previously drafted original data was changed',t=>{
  const root=fixture(t);
  const f=path.join(root,'docs/model-task-results/worker-B/npee-001/result.json');
  const d=JSON.parse(fs.readFileSync(f));
  d.entries[0].original.meaning='changed';
  fs.writeFileSync(f,JSON.stringify(d));
  const outDir=path.join(root,'output/refinement/abc-bulk');
  assert.throws(()=>candidates(root,{outputDir:outDir}),/identity\/original mismatch/);
  assert.ok(!fs.existsSync(outDir));
});
test('full repository crossbook indexes verified worker proposals without acceptance',()=>{
  const out=candidates(repoRoot,{save:false});
  assert.equal(out.summary.input_rows,26612);
  const current=plan(repoRoot,{save:false});
 assert.equal(out.summary.rows_without_worker_proposal,current.all.rows_not_yet_drafted);
  assert.ok(out.summary.matching_rows>=0);
  assert.equal(out.summary.matching_rows+out.summary.unmatched_rows,
  current.all.rows_not_yet_drafted);
  assert.equal(out.summary.accepted,0);
  assert.equal(out.summary.installed,0);
  assert.ok(out.matched.every(x=>x.options.length>0 && x.options.length<=4));
});
