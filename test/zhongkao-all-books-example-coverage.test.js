'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const legacy=require('../app/seed/reviewed-examples.json');
const {normalizePartOfSpeech}=require('../shared/domain');
const packages=[1,2,3,4].flatMap(n=>require('../app/seed/examples-zhongkao-coverage-part-'+String(n).padStart(2,'0')+'.json').examples);
function visible(w){
 const fallback=!w.homograph&&legacy[w.headword];
 return w.reviewed_example||reviewedExample(w)||
  (fallback&&normalizePartOfSpeech(w.pos)===fallback.pos?fallback:null);
}
test('Zhongkao coverage packages are complete and accurately bound to the 1713 accepted source identities',()=>{
 const built=V.buildBook(V.CATALOG.find(s=>s.file==='zhongkao.txt'));
 assert.equal(built.words.length,1713);
 assert.equal(packages.length,1713);
 const words=new Map(built.words.map(w=>[w.word,w])),seen=new Set();
 for(const x of packages){
  assert.equal(x.source_file,'zhongkao.txt');
  assert.equal(x.review_scope,'paired-example-only');
  assert.ok(['crossbook-sense-unverified','original-provisional'].includes(x.review_status));
  assert.ok(x.text?.trim()&&x.translation?.trim());
  assert.ok(!seen.has(x.word),'duplicate '+x.word);seen.add(x.word);
  const y=words.get(x.word);assert.ok(y,x.word);
  for(const k of ['word','headword','homograph','source_file','source_line','source_raw','pos','meaning'])
   assert.deepEqual(x[k],y[k],x.word+' '+k);
 }
});
test('all five source books supply complete bilingual examples to new installations',()=>{
 for(const spec of V.CATALOG){
  const built=V.buildBook(spec),missing=built.words.filter(w=>!visible(w)?.text?.trim()||!visible(w)?.translation?.trim());
  console.log(spec.name+': '+(built.words.length-missing.length)+'/'+built.words.length+' with bilingual examples');
  assert.equal(missing.length,0,spec.file+' missing: '+missing.slice(0,25).map(w=>w.word).join(','));
 }
});
test('Zhongkao source mismatch cannot borrow another word sense or guessed example',()=>{
 const w=V.buildBook(V.CATALOG.find(s=>s.file==='zhongkao.txt')).words.find(w=>w.word==='bamboo');
 assert.ok(w);assert.ok(reviewedExample(w)?.text.includes('bamboo'));
 for(const changes of [{source_file:'cet4.txt'},{source_line:w.source_line+1},
  {source_raw:'changed'},{pos:'v.'},{meaning:'other sense'},{word:'different'},{headword:'different'},{homograph:1}])
  assert.equal(reviewedExample({...w,...changes}),null,JSON.stringify(changes));
});
