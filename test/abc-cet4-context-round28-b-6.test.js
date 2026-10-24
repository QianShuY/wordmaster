'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected=[
  {
    "task": "cet4-041",
    "index": 76,
    "word": "cheap",
    "en": "I bought a cheap notebook to record my expenses during the trip.",
    "cn": "我买了一本便宜的笔记本，用来记录旅途中的开销。",
    "sourceLine": 637,
    "sourceRaw": "cheap [t∫iːp] a.廉价的；劣质的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "廉价的；劣质的"
    },
    "original": {
      "pos": "a.",
      "meaning": "廉价的；劣质的",
      "phonetic": "tʃiːp",
      "example": "The cheap notebook was enough for my travel notes.",
      "example_translation": "那本便宜的笔记本足够用来记录我的旅行。"
    },
    "inputSha": "30f64dc8066577b53b086f16d1eaa684fcfbddc4a5177cdc40ea98a3193c4ed2"
  },
  {
    "task": "cet4-042",
    "index": 11,
    "word": "classmate",
    "en": "My classmate shared her notes when I missed a lecture.",
    "cn": "我缺课时，同班同学把她的笔记借给了我。",
    "sourceLine": 692,
    "sourceRaw": "classmate [ˈklɑːsmeit] n.同班同学",
    "selectedSense": {
      "pos": "n.",
      "meaning": "同班同学"
    },
    "original": {
      "pos": "n.",
      "meaning": "同班同学",
      "phonetic": "ˈklɑːsmeit",
      "example": "A classmate helped me find the missing page.",
      "example_translation": "一位同班同学帮我找到了缺失的那页。"
    },
    "inputSha": "f3c3d1efe48eaf0ae2ebfee55852811fd60debdc1aff55bc34183c5b2b5b3fb1"
  },
  {
    "task": "cet4-042",
    "index": 56,
    "word": "comparison",
    "en": "A comparison of the two designs showed that the second used less energy.",
    "cn": "对两种设计进行比较后发现，第二种设计耗能更少。",
    "sourceLine": 765,
    "sourceRaw": "comparison [kəmˈpærisn] n.比较，对照；比似",
    "selectedSense": {
      "pos": "n.",
      "meaning": "比较，对照；比似"
    },
    "original": {
      "pos": "n.",
      "meaning": "比较，对照；比似",
      "phonetic": "kəmˈpærisn",
      "example": "The report includes a comparison of the two designs.",
      "example_translation": "报告中包含了对两种设计的比较。"
    },
    "inputSha": "f3c3d1efe48eaf0ae2ebfee55852811fd60debdc1aff55bc34183c5b2b5b3fb1"
  },
  {
    "task": "cet4-043",
    "index": 6,
    "word": "conversation",
    "en": "A conversation with the local guide helped us choose a safer route.",
    "cn": "与当地向导交谈后，我们选了一条更安全的路线。",
    "sourceLine": 866,
    "sourceRaw": "conversation [ˌkɔnvəˈsei∫ən] n.会话,非正式会谈",
    "selectedSense": {
      "pos": "n.",
      "meaning": "会话,非正式会谈"
    },
    "original": {
      "pos": "n.",
      "meaning": "会话,非正式会谈",
      "phonetic": "ˌkɔnvəˈseiʃən",
      "example": "A short conversation with the guide changed our route.",
      "example_translation": "与向导的一次简短交谈改变了我们的路线。"
    },
    "inputSha": "78a943d09fc355c16cf871fbb1ee1e369283d5ed94ef6bb227b43894ae8283ce"
  },
  {
    "task": "cet4-043",
    "index": 34,
    "word": "crash",
    "en": "The shopping trolley rolled down the slope and crashed into a wall.",
    "cn": "购物手推车沿斜坡滑下，撞上了一堵墙。",
    "sourceLine": 914,
    "sourceRaw": "crash [kræ∫] vi.碰撞，坠落 n.碰撞",
    "selectedSense": {
      "pos": "vi.",
      "meaning": "碰撞，坠落 n.碰撞"
    },
    "original": {
      "pos": "vi.",
      "meaning": "碰撞，坠落 n.碰撞",
      "phonetic": "kræʃ",
      "example": "The empty cart began to roll and might crash into the wall.",
      "example_translation": "空推车开始滑动，可能会撞上墙。"
    },
    "inputSha": "78a943d09fc355c16cf871fbb1ee1e369283d5ed94ef6bb227b43894ae8283ce"
  },
  {
    "task": "cet4-043",
    "index": 96,
    "word": "delicious",
    "en": "The soup smelled delicious as it simmered on the stove.",
    "cn": "汤在炉子上慢炖时散发出诱人的香味。",
    "sourceLine": 1025,
    "sourceRaw": "delicious [diˈli∫əs] a.美味的，怡人的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "美味的，怡人的"
    },
    "original": {
      "pos": "a.",
      "meaning": "美味的，怡人的",
      "phonetic": "diˈliʃəs",
      "example": "The soup smelled delicious after a long day outside.",
      "example_translation": "在外面过了漫长的一天后，这汤闻起来很美味。"
    },
    "inputSha": "78a943d09fc355c16cf871fbb1ee1e369283d5ed94ef6bb227b43894ae8283ce"
  }
];
test('CET-4: six source-locked bilingual edits remain review-only',()=>{
 assert.equal(expected.length,6);
 assert.equal(new Set(expected.map(x=>x.task+':'+x.index)).size,6);
 const cache=new Map();
 for(const row of expected){
  if(!cache.has(row.task)){
   const meta=manifest.files.find(x=>x.task_id===row.task);assert.ok(meta);
   const source=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015',meta.file),'utf8'));
   const result=JSON.parse(fs.readFileSync(path.join(root,'docs/model-task-results/worker-A',row.task,'result.json'),'utf8'));
   assert.equal(result.task_id,row.task);assert.equal(result.input_sha256,meta.sha256);
   assert.equal(result.status,'proposal');assert.equal(result.entries.length,meta.rows);assert.equal(source.entries.length,meta.rows);
   for(let i=0;i<meta.rows;i++){assert.deepEqual(result.entries[i].identity,source.entries[i].identity);assert.deepEqual(result.entries[i].original,source.entries[i].current)}
   cache.set(row.task,result);
  }
  const d=cache.get(row.task),e=d.entries[row.index];assert.equal(d.input_sha256,row.inputSha);
  assert.equal(e.identity.word,row.word);assert.equal(e.identity.source_line,row.sourceLine);assert.equal(e.identity.source_raw,row.sourceRaw);
  assert.deepEqual(e.selected_sense,row.selectedSense);assert.deepEqual(e.original,row.original);
  assert.equal(e.proposed.example,row.en);assert.equal(e.proposed.example_translation,row.cn);
  assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');assert.equal(e.verification,'needs-review');
  assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.deepEqual(e.evidence,[]);
  assert.ok(row.en.endsWith('.')&&row.cn.endsWith('。'));
  assert.deepEqual(rules.filter(r=>r.pattern.test(r.id==='translation-metalinguistic'?row.cn:row.en)).map(r=>r.id),[]);
 }
});
