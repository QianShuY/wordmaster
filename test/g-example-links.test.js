'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),{reviewedExample}=require('../shared/content-batch');
const batch=require('../app/seed/examples-common-g-reviewed-20261015.json');
test('268 original G bindings remain source-bound; nine historical conflicts need explicit reviewed corrections',()=>{
 assert.equal(batch.examples.length,268);assert.equal(batch.deferred.length,9);const built=new Map(V.CATALOG.map(s=>[s.file,V.buildBook(s)]));
 for(const p of batch.examples){const w=built.get(p.source_file).words.find(w=>w.word===p.word);assert.deepEqual(reviewedExample(w),{text:p.text,translation:p.translation});for(const change of [{meaning:'自建释义'},{pos:'own'},{source_raw:'changed'},{source_line:p.source_line+1},{word:'other'},{homograph:1}])assert.equal(reviewedExample({...w,...change}),null);assert.equal(p.full_dictionary_senses_reviewed,false);}
 const corrections=require('../app/seed/meanings-g-reviewed-20261015.json');for(const p of batch.deferred){const w=built.get(p.source_file).words.find(w=>w.word===p.word),fix=corrections.find(f=>f.source_file===p.source_file&&f.word===p.word);assert.ok(fix);assert.equal(w.meaning,fix.to.meaning);assert.deepEqual(reviewedExample(w),fix.example);assert.ok(p.reason);}
});
