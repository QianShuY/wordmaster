'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const {matchesSenseIdentity}=require('../shared/source-sense-binding');
const batch=require('../app/seed/examples-numbered-reviewed-20261015.json');
test('numbered examples bind only their individually reviewed source sense',()=>{
 const rows=V.buildBook(V.CATALOG.find(s=>s.file==='tem.txt')).words;
 assert.equal(batch.examples.length,16);
 for(const p of batch.examples){
  const w=rows.find(w=>w.word===p.word);assert.ok(w,p.word);
  assert.deepEqual(reviewedExample(w),{text:p.text,translation:p.translation});
  for(const changed of [{homograph:null},{homograph:p.homograph+1},{homograph:String(p.homograph)},
   {headword:'other'},{source_line:p.source_line+1},{source_raw:'edited'},{meaning:'edited'},{pos:'edited'},
   {word:p.headword},{source_file:'cet4.txt'}])assert.equal(reviewedExample({...w,...changed}),null,p.word+JSON.stringify(changed));
  const sibling=rows.find(r=>r.headword===w.headword&&r.word!==w.word);
  assert.ok(sibling,p.word);assert.equal(reviewedExample(sibling),null,sibling.word);
  for(const field of ['homograph','headword','source_line']){
   const incomplete={...p};delete incomplete[field];assert.equal(matchesSenseIdentity(incomplete,w),false,field);
  }
 }
});
test('legacy bindings cannot grant a numbered sense by changing the candidate identity',()=>{
 const ordinary={headword:'bank',homograph:null,source_line:1};
 assert.equal(matchesSenseIdentity({},ordinary),true);
 assert.equal(matchesSenseIdentity({}, {...ordinary,homograph:1}),false);
 assert.equal(matchesSenseIdentity({headword:'bank',homograph:1,source_line:1},ordinary),false);
});
