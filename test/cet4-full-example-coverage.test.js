'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../app/vocabulary');
const {reviewedExample}=require('../shared/content-batch');
const {normalizePartOfSpeech}=require('../shared/domain');
const legacy=require('../app/seed/reviewed-examples.json');
const manifest=require('../docs/model-tasks-20261015/manifest.json');
const taskMap=new Map(manifest.files.map(t=>[t.task_id,t]));
const packs=[1,2,3,4,5].flatMap(n=>require('../app/seed/examples-cet4-coverage-part-'+String(n).padStart(2,'0')+'.json').examples);
const results=new Map(), source=V.buildBook(V.CATALOG.find(s=>s.file==='cet4.txt'));
const byWord=new Map(source.words.map(w=>[w.word,w]));

test('CET4 coverage candidate packs are complete, source-locked and not labelled as dictionary-reviewed',()=>{
 assert.equal(source.words.length,4460);assert.equal(packs.length,4460);
 const seen=new Set();
 for(const item of packs){
  assert.equal(item.source_file,'cet4.txt');assert.equal(item.review_status,'unverified-candidate');
  assert.equal(item.review_scope,'paired-example-only');
  assert.ok(item.text?.trim()&&item.translation?.trim(),item.word);
  assert.ok(!seen.has(item.word),'duplicate CET4 word '+item.word);seen.add(item.word);
  const word=byWord.get(item.word);assert.ok(word,item.word);
  for(const k of ['source_line','source_raw','headword','homograph'])assert.deepEqual(item[k],word[k],item.word+' '+k);
  const {task_id,row_index,input_sha256}=item.candidate;
  const task=taskMap.get(task_id);assert.ok(task,task_id);assert.equal(input_sha256,task.sha256);
  if(!results.has(task_id))results.set(task_id,require('../docs/model-task-results/worker-A/'+task_id+'/result.json'));
  const draft=results.get(task_id);assert.equal(draft.input_sha256,input_sha256);
  const e=draft.entries[row_index];assert.ok(e,item.word);
  assert.deepEqual(e.identity,{source_file:item.source_file,source_line:item.source_line,word:item.word,headword:item.headword,homograph:item.homograph,source_raw:item.source_raw});
  assert.equal(e.original.pos,item.pos);assert.equal(e.original.meaning,item.meaning);
  assert.equal(e.proposed.example,item.text);assert.equal(e.proposed.example_translation,item.translation);
  assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);
 }
 assert.equal(seen.size,4460);
});

test('CET4 fresh source has a bilingual pair per valid word and CET6 remains complete',()=>{
 for(const w of source.words){
  const pair=w.reviewed_example||reviewedExample(w);
  assert.ok(pair?.text?.trim()&&pair?.translation?.trim(),w.word+' has no source-bound bilingual example');
 }
 const six=V.buildBook(V.CATALOG.find(s=>s.file==='cet6.txt'));
 assert.equal(six.words.length,2272);
 for(const w of six.words){
  const legacyPair=!w.homograph&&legacy[w.headword]&&normalizePartOfSpeech(w.pos)===legacy[w.headword].pos?legacy[w.headword]:null;
  assert.ok((w.reviewed_example||reviewedExample(w)||legacyPair)?.text?.trim(),w.word);
 }
 const w=source.words.find(x=>x.word==='absolute');assert.ok(w);
 for(const changes of [{source_file:'custom.txt'},{source_line:w.source_line+1},{source_raw:'tampered source'},{pos:'wrong.'},{meaning:'other meaning'},{headword:'wrong'},{homograph:1}])
  assert.equal(reviewedExample({...w,...changes}),null,JSON.stringify(changes));
});
