'use strict';
// Read-only regression: counts source-bound examples available to a new installation.
// Never reads or writes a user's SQLite database and never promotes worker drafts.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const V=require('../app/vocabulary');
const {reviewedExample}=require('../shared/content-batch');
const {normalizePartOfSpeech}=require('../shared/domain');
const legacy=require('../app/seed/reviewed-examples.json');
const TASK_SHA={
  "cet4-001": "60013c113181553373651599696578c0701e372c6187c294b5c12fc51269e49b",
  "cet4-002": "38de899560c65eb45edb1f12875dc25d55e42f7fc3cc275ed453a6bb2d686663"
};
const QUEUE=[
  {
    "task_id": "cet4-001",
    "row_index": 1,
    "word": "absolute",
    "source_line": 17
  },
  {
    "task_id": "cet4-001",
    "row_index": 6,
    "word": "acceleration",
    "source_line": 26
  },
  {
    "task_id": "cet4-001",
    "row_index": 7,
    "word": "acceptable",
    "source_line": 29
  },
  {
    "task_id": "cet4-001",
    "row_index": 17,
    "word": "accuracy",
    "source_line": 44
  },
  {
    "task_id": "cet4-001",
    "row_index": 18,
    "word": "accustom",
    "source_line": 47
  },
  {
    "task_id": "cet4-001",
    "row_index": 21,
    "word": "acre",
    "source_line": 55
  },
  {
    "task_id": "cet4-001",
    "row_index": 22,
    "word": "actor",
    "source_line": 61
  },
  {
    "task_id": "cet4-001",
    "row_index": 23,
    "word": "actress",
    "source_line": 62
  },
  {
    "task_id": "cet4-001",
    "row_index": 26,
    "word": "ad",
    "source_line": 66
  },
  {
    "task_id": "cet4-001",
    "row_index": 30,
    "word": "admission",
    "source_line": 77
  },
  {
    "task_id": "cet4-001",
    "row_index": 31,
    "word": "advanced",
    "source_line": 82
  },
  {
    "task_id": "cet4-001",
    "row_index": 32,
    "word": "adverb",
    "source_line": 85
  },
  {
    "task_id": "cet4-001",
    "row_index": 33,
    "word": "advertisement",
    "source_line": 86
  },
  {
    "task_id": "cet4-001",
    "row_index": 35,
    "word": "aeroplane",
    "source_line": 90
  },
  {
    "task_id": "cet4-001",
    "row_index": 38,
    "word": "agent",
    "source_line": 105
  },
  {
    "task_id": "cet4-001",
    "row_index": 41,
    "word": "aim",
    "source_line": 114
  },
  {
    "task_id": "cet4-001",
    "row_index": 42,
    "word": "aircraft",
    "source_line": 116
  },
  {
    "task_id": "cet4-001",
    "row_index": 43,
    "word": "airplane",
    "source_line": 118
  },
  {
    "task_id": "cet4-001",
    "row_index": 44,
    "word": "alike",
    "source_line": 122
  },
  {
    "task_id": "cet4-001",
    "row_index": 47,
    "word": "alphabet",
    "source_line": 131
  },
  {
    "task_id": "cet4-001",
    "row_index": 49,
    "word": "altitude",
    "source_line": 137
  },
  {
    "task_id": "cet4-001",
    "row_index": 50,
    "word": "aluminium",
    "source_line": 139
  },
  {
    "task_id": "cet4-001",
    "row_index": 51,
    "word": "amaze",
    "source_line": 142
  },
  {
    "task_id": "cet4-001",
    "row_index": 53,
    "word": "ampere",
    "source_line": 150
  },
  {
    "task_id": "cet4-001",
    "row_index": 58,
    "word": "angel",
    "source_line": 159
  },
  {
    "task_id": "cet4-001",
    "row_index": 59,
    "word": "announcer",
    "source_line": 166
  },
  {
    "task_id": "cet4-001",
    "row_index": 63,
    "word": "anyone",
    "source_line": 178
  },
  {
    "task_id": "cet4-001",
    "row_index": 64,
    "word": "apologize",
    "source_line": 184
  },
  {
    "task_id": "cet4-001",
    "row_index": 66,
    "word": "apparatus",
    "source_line": 186
  },
  {
    "task_id": "cet4-001",
    "row_index": 67,
    "word": "apparent",
    "source_line": 187
  },
  {
    "task_id": "cet4-001",
    "row_index": 69,
    "word": "appearance",
    "source_line": 190
  },
  {
    "task_id": "cet4-001",
    "row_index": 70,
    "word": "appliance",
    "source_line": 193
  },
  {
    "task_id": "cet4-001",
    "row_index": 71,
    "word": "applicable",
    "source_line": 194
  },
  {
    "task_id": "cet4-001",
    "row_index": 72,
    "word": "appoint",
    "source_line": 197
  },
  {
    "task_id": "cet4-001",
    "row_index": 73,
    "word": "approval",
    "source_line": 202
  },
  {
    "task_id": "cet4-001",
    "row_index": 75,
    "word": "approximately",
    "source_line": 205
  },
  {
    "task_id": "cet4-001",
    "row_index": 78,
    "word": "arbitrary",
    "source_line": 208
  },
  {
    "task_id": "cet4-001",
    "row_index": 79,
    "word": "architecture",
    "source_line": 209
  },
  {
    "task_id": "cet4-001",
    "row_index": 80,
    "word": "argument",
    "source_line": 212
  },
  {
    "task_id": "cet4-001",
    "row_index": 81,
    "word": "arithmetic",
    "source_line": 214
  },
  {
    "task_id": "cet4-001",
    "row_index": 85,
    "word": "artistic",
    "source_line": 229
  },
  {
    "task_id": "cet4-001",
    "row_index": 87,
    "word": "ash",
    "source_line": 231
  },
  {
    "task_id": "cet4-001",
    "row_index": 90,
    "word": "assembly",
    "source_line": 240
  },
  {
    "task_id": "cet4-001",
    "row_index": 91,
    "word": "assignment",
    "source_line": 243
  },
  {
    "task_id": "cet4-001",
    "row_index": 92,
    "word": "assist",
    "source_line": 244
  },
  {
    "task_id": "cet4-001",
    "row_index": 94,
    "word": "assure",
    "source_line": 249
  },
  {
    "task_id": "cet4-001",
    "row_index": 95,
    "word": "atmospheric",
    "source_line": 256
  },
  {
    "task_id": "cet4-001",
    "row_index": 97,
    "word": "atomic",
    "source_line": 258
  },
  {
    "task_id": "cet4-002",
    "row_index": 0,
    "word": "attentive",
    "source_line": 265
  },
  {
    "task_id": "cet4-002",
    "row_index": 1,
    "word": "attraction",
    "source_line": 268
  },
  {
    "task_id": "cet4-002",
    "row_index": 2,
    "word": "attractive",
    "source_line": 269
  }
];
function freshSourceCoverage(file){
 const spec=V.CATALOG.find(s=>s.file===file);
 const built=V.buildBook(spec);
 const missing=[],withPairs=[];
 for(const word of built.words){
  const fallback=!word.homograph&&legacy[word.headword];
  const pair=word.reviewed_example||reviewedExample(word)||(fallback&&normalizePartOfSpeech(word.pos)===fallback.pos?fallback:null);
  if(pair&&String(pair.text||'').trim()&&String(pair.translation||'').trim())withPairs.push(word.word);
  else missing.push(word.word);
 }
 return {total:built.words.length,paired:withPairs.length,missing,excluded:built.report.excluded,byWord:new Map(built.words.map(w=>[w.word,w]))};
}
test('CET4/CET6 static source coverage is not confused with 26,612 review-only drafts',()=>{
 const four=freshSourceCoverage('cet4.txt'),six=freshSourceCoverage('cet6.txt');
 assert.equal(four.total,4460);assert.equal(six.total,2272);
 assert.equal(four.excluded,157);assert.equal(six.excluded,0);
 assert.equal(four.paired+four.missing.length,four.total);
 assert.equal(six.paired+six.missing.length,six.total);
 assert.equal(six.paired,2272,'all six previously held CET6 lexical identities must have real source-bound pairs');
 assert.equal(four.paired,4460,'CET4 must now have a complete source-bound bilingual pair for every learnable word');
 console.log('CET4 source-visible bilingual pairs: '+four.paired+'/'+four.total+'; missing: '+four.missing.length);
 console.log('CET6 source-visible bilingual pairs: '+six.paired+'/'+six.total+'; missing: '+six.missing.length);
});
test('51 formerly missing CET4 candidates retain source identity and are now available to new installations',()=>{
 const four=freshSourceCoverage('cet4.txt');
 const missing=new Set(four.missing);
 const cache=new Map(),seen=new Set();
 assert.equal(QUEUE.length,51);
 for(const q of QUEUE){
  const key=q.task_id+'#'+q.row_index;assert.ok(!seen.has(key));seen.add(key);
  if(!cache.has(q.task_id))cache.set(q.task_id,require('../docs/model-task-results/worker-A/'+q.task_id+'/result.json'));
  const task=cache.get(q.task_id),entry=task.entries[q.row_index],word=four.byWord.get(q.word);
  assert.equal(task.input_sha256,TASK_SHA[q.task_id]);
  assert.ok(word,q.word);assert.ok(entry,q.word);
  assert.equal(entry.identity.word,q.word);assert.equal(entry.identity.source_file,'cet4.txt');
  assert.equal(entry.identity.source_line,q.source_line);assert.equal(entry.identity.source_raw,word.source_raw);
  assert.equal(entry.original.pos,word.pos,'original POS must match the built-in source row');
  assert.equal(entry.original.example,'');assert.equal(entry.original.example_translation,'');
  assert.equal(normalizePartOfSpeech(entry.selected_sense.pos),normalizePartOfSpeech(entry.original.pos));
  assert.ok(entry.proposed.example?.trim()&&entry.proposed.example_translation?.trim(),q.word);
  assert.equal(entry.verification,'source-checked');assert.equal(entry.external_human_review,false);
  assert.equal(entry.full_dictionary_senses_reviewed,false);assert.ok(Array.isArray(entry.evidence));
  assert.ok(!missing.has(q.word),'new CET4 source coverage must include the formerly missing pair: '+q.word);
 }
});
