'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch'),batch=require('../app/seed/examples-common-d-reviewed-20261014.json');
test('252 original D bindings and eight flagged senses require explicit reviewed corrections',()=>{
 const index=new Map(V.CATALOG.flatMap(s=>V.buildBook(s).words).map(w=>[w.source_file+':'+w.word,w]));
 assert.equal(batch.examples.length,252);assert.equal(batch.deferred.length,8);
 for(const e of batch.examples){const w=index.get(e.source_file+':'+e.word);assert.deepEqual(reviewedExample(w),{text:e.text,translation:e.translation});
  for(const change of [{meaning:'个人修改'},{source_line:w.source_line+1},{source_raw:'other source'},{homograph:1}])assert.equal(reviewedExample({...w,...change}),null);
 }
 const fixes=new Map(require('../app/seed/meanings-deferred-reviewed-20261014.json').map(p=>[p.source_file+':'+p.word,p]));
 for(const e of batch.deferred){const key=e.source_file+':'+e.word,w=index.get(key),p=fixes.get(key);assert.ok(p,key);assert.deepEqual(reviewedExample(w),p.example);assert.equal(reviewedExample({...w,meaning:p.from.meaning}),null,key);}
 assert.ok(batch.deferred.some(e=>e.word==='bored'));assert.ok(batch.deferred.some(e=>e.word==='button'));
});
