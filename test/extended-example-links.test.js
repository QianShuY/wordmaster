'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch'),batch=require('../app/seed/examples-extended-reviewed-20261014.json');
test('537 original bindings and fifteen flagged conflicts remain traceable to explicit reviewed corrections',()=>{
 const rows=V.CATALOG.flatMap(s=>V.buildBook(s).words),index=new Map(rows.map(w=>[w.source_file+':'+w.word,w]));
 assert.equal(batch.examples.length,537);assert.equal(batch.deferred.length,15);
 for(const e of batch.examples){const w=index.get(e.source_file+':'+e.word);assert.ok(w);assert.deepEqual(reviewedExample(w),{text:e.text,translation:e.translation});
  assert.equal(reviewedExample({...w,source_line:w.source_line+1}),null);assert.equal(reviewedExample({...w,meaning:'用户手改'}),null);
 }
 const fixes=new Map([...require('../app/seed/meanings-reviewed-20261014.json'),...require('../app/seed/meanings-deferred-reviewed-20261014.json')].map(p=>[p.source_file+':'+p.word,p]));
 for(const e of batch.deferred){const key=e.source_file+':'+e.word,w=index.get(key),p=fixes.get(key);assert.ok(p,key);assert.deepEqual(reviewedExample(w),p.example);assert.equal(reviewedExample({...w,meaning:p.from.meaning}),null,key);}
 assert.ok(batch.deferred.some(e=>e.word==='billion'&&e.source_file==='cet4.txt'));
 assert.ok(batch.deferred.some(e=>e.word==='ankle'&&e.source_file==='tem.txt'));
});
