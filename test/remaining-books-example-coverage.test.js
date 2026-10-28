'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const {normalizePartOfSpeech}=require('../shared/domain');
const legacy=require('../app/seed/reviewed-examples.json');
const manifest=require('../docs/model-tasks-20261015/manifest.json');
const taskIndex=new Map(manifest.files.map(f=>[f.task_id,f]));
const packs=[['npee',6,5384,'npee.txt'],['tem',10,12439,'tem.txt']];
function available(word){
 const fallback=!word.homograph&&legacy[word.headword];
 return word.reviewed_example||reviewedExample(word)||
  (fallback&&normalizePartOfSpeech(word.pos)===fallback.pos?fallback:null);
}
test('all source-bound graduate-exam and TEM coverage candidates retain raw identities',()=>{
 for(const [group,partCount,expected,file] of packs){
  const items=Array.from({length:partCount},(_,i)=>require('../app/seed/examples-'+group+'-coverage-part-'+String(i+1).padStart(2,'0')+'.json').examples).flat();
  assert.equal(items.length,expected,group);
  const seen=new Set();
  for(const p of items){
   assert.equal(p.source_file,file);assert.equal(p.review_status,'unverified-candidate');
   assert.equal(p.review_scope,'paired-example-only');
   assert.ok(p.word&&p.source_raw&&p.text?.trim()&&p.translation?.trim(),p.word);
   assert.ok(!seen.has(p.word),'duplicate '+group+' '+p.word);seen.add(p.word);
   const [id,j,digest]=[p.candidate.task_id,p.candidate.row_index,p.candidate.input_sha256];
   assert.equal(taskIndex.get(id)?.sha256,digest);
   assert.ok(Number.isInteger(j)&&j>=0);
  }
 }
});
test('new-source bilingual coverage for graduate and TEM books, without altering CET4/CET6',()=>{
 for(const spec of V.CATALOG){
  const built=V.buildBook(spec),missing=built.words.filter(w=>!available(w)?.text?.trim()||!available(w)?.translation?.trim());
  console.log(spec.name+': '+(built.words.length-missing.length)+'/'+built.words.length+' bilingual source pairs, missing '+missing.length);
  if(['cet4.txt','cet6.txt','npee.txt','tem.txt'].includes(spec.file))assert.equal(missing.length,0,spec.file+': '+missing.slice(0,12).map(w=>w.word).join(', '));
 }
});
test('provisional NPEE/TEM examples reject changed source identities and senses',()=>{
 for(const file of ['npee.txt','tem.txt']){
  const w=V.buildBook(V.CATALOG.find(s=>s.file===file)).words.find(x=>x.word==='abacus'||x.word==='a');
  assert.ok(w,file);
  for(const edits of [{source_file:'wrong.txt'},{source_line:w.source_line+1},{source_raw:'tampered source line'},{pos:'bad.'},{meaning:'another meaning'},{headword:'not-the-headword'},{homograph:99}])
   assert.equal(reviewedExample({...w,...edits}),null,file+' '+JSON.stringify(edits));
 }
});
