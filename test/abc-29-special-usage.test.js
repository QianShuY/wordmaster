'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {patch}=require('../scripts/apply-abc-29-special-contexts');
const {scan}=require('../scripts/report-abc-dangerous-examples');
const items=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/model-quality-patches/manual-natural-29-metalinguistic-20261018.json'),'utf8')).entries;
test('all 29 original mention-only placeholders have contextual bilingual replacements',()=>{
 const x=patch(ROOT,{apply:false});
 assert.equal(x.all,29);
 assert.equal(x.edited+x.already,29);
 assert.equal(x.approved,0);
 assert.equal(x.installed,0);
 assert.equal(x.learning_data_changed,false);
 assert.equal(items.length,29);
 for(const v of items){
  assert.ok(v.translation.match(/[一-鿿]/));
  assert.ok(v.example.toLowerCase().includes(v.word.toLowerCase().replace(/ \d+$/,'')));
 }
});
test('special term examples are source guarded; after commit no mention-only placeholders remain',()=>{
 const x=patch(ROOT,{apply:false});
 const a=scan(ROOT,{save:false});
 if(x.already===29)assert.equal(a.metalinguistic.length,0);
 else assert.equal(a.metalinguistic.length,29);
 assert.ok(a.all_numbered_headwords>0);
});
