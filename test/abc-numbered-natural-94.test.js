'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {run,FILES}=require('../scripts/apply-abc-numbered-senses');
const {scan}=require('../scripts/report-abc-dangerous-examples');
test('all 274 numbered CET6/TEM sense-specific examples are bilingual and source-bound',()=>{
 const x=run(root,{apply:false});
 assert.equal(x.all,274);
 assert.equal(x.already+x.edited,274);
 assert.equal(x.installed,0);
 assert.equal(x.accepted,0);
 assert.equal(x.student_data_touched,false);
 const examples=FILES.flatMap(p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')).entries);
 assert.equal(examples.length,274);
 const unique=new Set();
 for(const p of examples){
  const id=p.task_id+':'+p.row_index;
  assert.equal(unique.has(id),false,id);
  unique.add(id);
  assert.ok(/[一-鿿]/.test(p.translation));
  assert.ok(p.example.toLowerCase().includes(p.word.replace(/ \d+$/,'').toLowerCase()),id);
  assert.ok(!p.example.toLowerCase().includes(p.word.toLowerCase()),id);
 }
});
test('numbered senses are fixed without hiding legitimate homograph source suffixes',()=>{
 const x=run(root,{apply:false});
 const a=scan(root,{save:false});
 assert.ok(a.all_numbered_headwords>=274);
 assert.equal(a.metalinguistic.length,0);
 if(x.already===274)assert.equal(a.homograph_number_leaks.length,0);
 else {
  assert.equal(x.already,127);
  assert.equal(a.homograph_number_leaks.length,147);
 }
});
