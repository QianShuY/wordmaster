'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch'),batch=require('../app/seed/examples-common-e-reviewed-20261014.json');
test('264 E bindings retain China versus china and ten historical mismatches need explicit resolution',()=>{
 const index=new Map(V.CATALOG.flatMap(s=>V.buildBook(s).words).map(w=>[w.source_file+':'+w.word,w]));
 assert.equal(batch.examples.length,264);assert.equal(batch.deferred.length,10);
 for(const e of batch.examples){const w=index.get(e.source_file+':'+e.word);assert.deepEqual(reviewedExample(w),{text:e.text,translation:e.translation});
  for(const change of [{meaning:'个人修改'},{source_line:w.source_line+1},{source_raw:'other source'},{homograph:1}])assert.equal(reviewedExample({...w,...change}),null);
 }
 const fixes=new Map(require('../app/seed/meanings-deferred-reviewed-20261014.json').map(p=>[p.source_file+':'+p.word,p]));
 for(const e of batch.deferred){const key=e.source_file+':'+e.word,w=index.get(key),p=fixes.get(key);assert.ok(p,key);assert.deepEqual(reviewedExample(w),p.example);assert.equal(reviewedExample({...w,meaning:p.from.meaning}),null,key);}
 const country=reviewedExample(index.get('cet4.txt:China')),porcelain=reviewedExample(index.get('cet4.txt:china'));
 assert.ok(country.translation.includes('中国'));assert.ok(porcelain.translation.includes('瓷器'));
 assert.ok(batch.deferred.some(e=>e.word==='cheer'));assert.ok(batch.deferred.some(e=>e.word==='captain'));
});
