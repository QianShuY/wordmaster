'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const batch=require('../app/seed/examples-common-a-reviewed-20261014.json');
test('237 original cross-book bindings and twelve flagged conflicts require explicit source-bound resolution',()=>{
 assert.equal(batch.examples.length,237);assert.equal(batch.deferred.length,12);
 const rows=V.CATALOG.flatMap(spec=>V.buildBook(spec).words),index=new Map(rows.map(w=>[w.source_file+':'+w.word,w]));
 for(const e of batch.examples){
  const word=index.get(e.source_file+':'+e.word);assert.ok(word);
  assert.deepEqual(reviewedExample(word),{text:e.text,translation:e.translation});
  for(const changed of [{source_line:word.source_line+1},{pos:'changed'},{meaning:'自建释义'},{source_raw:'changed'},{homograph:1},{source_file:null}])assert.equal(reviewedExample({...word,...changed}),null,e.word);
 }
 const fixes=new Map(require('../app/seed/meanings-deferred-reviewed-20261014.json').map(p=>[p.source_file+':'+p.word,p]));
 for(const e of batch.deferred){const key=e.source_file+':'+e.word,w=index.get(key),p=fixes.get(key);assert.ok(p,key);
  assert.deepEqual(reviewedExample(w),p.example);assert.equal(reviewedExample({...w,meaning:p.from.meaning}),null,key);
 }
 assert.ok(batch.deferred.some(e=>e.source_file==='npee.txt'&&e.word==='airline'));
 assert.ok(batch.deferred.some(e=>e.source_file==='cet4.txt'&&e.word==='adapt'));
});
