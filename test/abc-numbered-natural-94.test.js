'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {run}=require('../scripts/apply-abc-numbered-senses');
const {scan}=require('../scripts/report-abc-dangerous-examples');
const record=JSON.parse(fs.readFileSync(path.join(root,'docs/model-quality-patches/manual-natural-cet6-numbered-94-20261018.json'),'utf8'));
test('all CET6 numbered-homograph pair examples are original-context aligned, unapproved and guarded',()=>{
 const x=run(root,{apply:false});
 assert.equal(x.all,127);
 assert.equal(x.already+x.edited,127);
 assert.equal(x.installed,0);
 assert.equal(x.accepted,0);
 assert.equal(x.student_data_touched,false);
 assert.equal(record.entries.length,94);
 for(const p of record.entries){
  assert.ok(/[一-鿿]/.test(p.translation));
  assert.ok(p.example.toLowerCase().includes(p.word.replace(/ \d+$/,'').toLowerCase()));
  assert.ok(!p.example.toLowerCase().includes(p.word.toLowerCase()));
 }
});
test('when edits land, there are no remaining CET6 homograph number leaks',()=>{
 const x=run(root,{apply:false});
 const a=scan(root,{save:false});
 if(x.already===127){
  assert.equal(a.homograph_number_leaks.filter(z=>z.task_id.startsWith('cet6-')).length,0);
  assert.equal(a.homograph_number_leaks.filter(z=>z.task_id.startsWith('tem-')).length,147);
 }else{
  assert.equal(a.homograph_number_leaks.filter(z=>z.task_id.startsWith('cet6-')).length,94);
  assert.equal(a.homograph_number_leaks.filter(z=>z.task_id.startsWith('tem-')).length,180);
 }
});
