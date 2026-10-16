'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),{reviewedMeaning}=require('../shared/content-corrections'),{reviewedExample}=require('../shared/content-batch');
const patches=require('../app/seed/meanings-reviewed-20261014.json');
test('seven reviewed meaning corrections preserve word identity, historical number usage and exact source guards',()=>{
 assert.equal(patches.length,7);
 for(const p of patches){
  const raw={word:p.word,headword:p.headword,homograph:p.homograph,source_file:p.source_file,source_line:p.source_line,source_raw:p.source_raw,...p.from};
  assert.equal(reviewedMeaning(raw),p);
  for(const changed of [{meaning:'手改含义'},{phonetic:'custom'},{source_line:p.source_line+1},{source_raw:'different'},{headword:'different'},{homograph:1}])assert.equal(reviewedMeaning({...raw,...changed}),null);
  const word=V.buildBook(V.CATALOG.find(s=>s.file===p.source_file)).words.find(w=>w.word===p.word);
  assert.equal(word.meaning,p.to.meaning);assert.equal(word.source_raw,p.source_raw);assert.equal(word.headword,p.headword);assert.equal(word.phonetic,p.from.phonetic);
  assert.deepEqual(reviewedExample(word),p.example);
 }
 const get=(file,word)=>patches.find(p=>p.source_file===file&&p.word===word).to.meaning;
 assert.ok(get('cet4.txt','billion').startsWith('十亿'));assert.ok(get('tem.txt','billion').includes('历史英式'));
 assert.equal(get('tem.txt','ankle'),'踝，踝关节部');assert.ok(!get('tem.txt','baseball').includes('垒球'));
});
