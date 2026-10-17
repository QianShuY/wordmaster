'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const files=read('docs/model-tasks-20261015/manifest.json').files;
const manifest=new Map(files.map(x=>[x.task_id,x]));

test('persisted A/B examples are source-keyed sidecars and never imply approval',()=>{
 let seen=0,sidecars=0;
 const all=new Set();
 for(const worker of ['A','B']){
  const base=path.join(root,'docs/model-task-results','worker-'+worker);
  const tasks=fs.readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory());
  for(const task of tasks){
   const file=path.join(base,task.name,'reused-candidates.json');
   if(!fs.existsSync(file))continue;
   sidecars++;
   const report=JSON.parse(fs.readFileSync(file,'utf8'));
   const metadata=manifest.get(task.name);
   assert.ok(metadata,'unknown sidecar source task '+task.name);
   assert.equal(report.task_id,task.name);
   assert.equal(report.input_sha256,metadata.sha256);
   assert.equal(report.not_an_installed_or_accepted_vocabulary_result,true);
   const original=read('docs/model-tasks-20261015/'+metadata.file);
   for(const row of report.entries){
    const k=task.name+':'+row.row_index;
    assert.ok(!all.has(k),'duplicate row sidecar '+k);
    all.add(k);
    const item=original.entries[row.row_index];
    assert.ok(item,'row outside source input '+k);
    if(item.identity)assert.deepEqual(row.identity,item.identity);
    if(item.current)assert.deepEqual(row.original,item.current);
    assert.equal(row.verification,'needs-review');
    assert.equal(row.external_human_review,false);
    assert.equal(row.full_dictionary_senses_reviewed,false);
    assert.equal(row.authoritative_dictionary_sense_validation,false);
    assert.ok(row.suggested.example&&row.suggested.example_translation);
    assert.ok(row.provenance.length);
    assert.ok(row.issues.length);
    seen++;
   }
  }
 }
 assert.ok(sidecars>=34,'preserve original 34 candidate sidecars');
 assert.ok(seen>=1640,'preserve 1640 historical candidates');
});

test('source-corrected C definitions do not mix their noun/verb meanings',()=>{
 const rows=read('docs/model-task-results/worker-C/tem-125/result.json').entries;
 const checks=[
  ['question','n.','问题',/ˈkwestʃən/,'question_1'],
  ['shuttle','n.','交通工具',/ˈʃʌtl/,'shuttle_1'],
  ['sneak','v.','偷偷',/sniːk/,'sneak_1'],
  ['travel','v.','前往',/ˈtrævl/,'travel_1'],
 ];
 for(const [word,pos,meaning,ipa,url] of checks){
  const e=rows.find(x=>x.identity.word===word);
  assert.ok(e,word);
  assert.equal(e.selected_sense.pos,pos);
  assert.ok(e.selected_sense.meaning.includes(meaning));
  assert.equal(e.verification,'needs-review');
  assert.equal(e.external_human_review,false);
  assert.equal(e.full_dictionary_senses_reviewed,false);
  assert.ok(e.issues.some(x=>x.code==='selected-sense-mixed-wordclass-corrected'));
  assert.ok(e.evidence.some(x=>x.accessed===true
   && x.independent_primary_page_review===true
   && x.url.includes(url)&&ipa.test(x.checked_uk_ipa)));
 }
});
