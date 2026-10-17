'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const manifest=read('docs/model-tasks-20261015/manifest.json');
const all=[
  ['A','cet4-020'],['A','cet4-021'],
  ['B','npee-041'],['B','npee-042'],
];
test('four new batches preserve exact source identity, all 400 bilingual pairs and unapproved status',()=>{
 let pairs=0;
 for(const [worker,task] of all){
  const meta=manifest.files.find(x=>x.task_id===task);
  assert.ok(meta,task+' task in manifest');
  const original=read('docs/model-tasks-20261015/'+meta.file);
  const result=read('docs/model-task-results/worker-'+worker+'/'+task+'/result.json');
  const progress=read('docs/model-task-results/worker-'+worker+'/progress.json');
  assert.equal(original.entries.length,100);
  assert.equal(meta.rows,100);
  assert.equal(result.task_id,task);
  assert.equal(result.input_sha256,meta.sha256);
  assert.equal(result.status,'proposal');
  assert.equal(result.entries.length,100);
  const p=progress.tasks.find(x=>x.task_id===task);
  assert.equal(p.status,'submitted');
  assert.equal(p.processed_rows,100);
  for(let i=0;i<100;i++){
    const entry=result.entries[i],old=original.entries[i];
    assert.deepEqual(entry.identity,old.identity);
    assert.deepEqual(entry.original,old.current);
    assert.equal(entry.verification,'needs-review');
    assert.equal(entry.external_human_review,false);
    assert.equal(entry.full_dictionary_senses_reviewed,false);
    assert.ok(entry.issues.length>=1);
    assert.deepEqual(entry.evidence,[]);
    assert.equal(entry.proposed.pos,old.current.pos);
    assert.equal(entry.proposed.meaning,old.current.meaning);
    assert.equal(entry.proposed.phonetic,null);
    assert.ok(entry.proposed.example.trim().length>20,task+':'+i+' short English');
    assert.ok(/[\u3400-\u9fff]/.test(entry.proposed.example_translation),
      task+':'+i+' missing Chinese');
    assert.ok(entry.proposed.example.toLowerCase().includes(entry.identity.word.toLowerCase()),
      task+':'+i+' word absent from English example');
    pairs++;
  }
 }
 assert.equal(pairs,400);
});
test('source word class anomalies are recorded for later manual review',()=>{
 const A=read('docs/model-task-results/worker-A/cet4-020/result.json').entries;
 const B=read('docs/model-task-results/worker-B/npee-042/result.json').entries;
 for(const word of ['oriental','outskirt','pant','overall']){
  const entry=A.find(x=>x.identity.word===word);
  assert.ok(entry.issues.some(i=>/风险|疑点|词性/.test(i)),word);
 }
 const thrift=B.find(x=>x.identity.word==='thrift');
 assert.equal(thrift.original.pos,'a.');
 assert.equal(thrift.selected_sense.pos,'n.');
 assert.equal(thrift.verification,'needs-review');
 assert.ok(thrift.issues.some(i=>/词性/.test(i)));
});
