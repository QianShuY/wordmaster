'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected=[
  {
    "task": "cet6-022",
    "index": 15,
    "word": "comic",
    "en": "The play includes a comic scene in which two strangers mistake each other for old friends.",
    "cn": "这部戏有一幕喜剧场景，两个陌生人误以为彼此是老朋友。",
    "sourceLine": 370,
    "sourceRaw": "comic [ˈkɒmɪk] adj. 滑稽的，喜剧化的  || comic strip连环漫画",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "滑稽的，喜剧化的  || comic strip连环漫画"
    },
    "original": {
      "pos": "adj.",
      "meaning": "滑稽的，喜剧化的  || comic strip连环漫画",
      "phonetic": "ˈkɒmɪk",
      "example": "The actor added a comic scene to the serious story.",
      "example_translation": "演员给这个严肃的故事增添了一个滑稽的场景。"
    },
    "inputSha": "d5850c992550cd5c43f32a2ac09a522b68b2ade25c5250fa0578fc6822cd057d"
  },
  {
    "task": "cet6-022",
    "index": 17,
    "word": "commit",
    "en": "The suspect admitted that he had committed the theft.",
    "cn": "嫌疑人承认自己犯下了盗窃罪。",
    "sourceLine": 378,
    "sourceRaw": "commit [kəˈmɪt] v. 1. 犯(罪)  2. 委托",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 犯(罪)  2. 委托"
    },
    "original": {
      "pos": "v.",
      "meaning": "1. 犯(罪)  2. 委托",
      "phonetic": "kəˈmɪt",
      "example": "The evidence does not show who might commit the crime.",
      "example_translation": "这些证据没有表明谁可能犯下这起罪行。"
    },
    "inputSha": "d5850c992550cd5c43f32a2ac09a522b68b2ade25c5250fa0578fc6822cd057d"
  },
  {
    "task": "cet6-022",
    "index": 24,
    "word": "comparison",
    "en": "A comparison of the two designs showed that the second used less energy.",
    "cn": "对两种设计进行比较后发现，第二种设计耗能更少。",
    "sourceLine": 392,
    "sourceRaw": "comparison [kəmˈpærɪsən] n. 1. 比较，对照 2. 比喻  || beyond comparison无法相比 / in comparison with和…相比较",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 比较，对照 2. 比喻  || beyond comparison无法相比 / in comparison with和…相比较"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 比较，对照 2. 比喻  || beyond comparison无法相比 / in comparison with和…相比较",
      "phonetic": "kəmˈpærɪsən",
      "example": "The report includes a comparison of the two designs.",
      "example_translation": "报告中包含了对两种设计的比较。"
    },
    "inputSha": "d5850c992550cd5c43f32a2ac09a522b68b2ade25c5250fa0578fc6822cd057d"
  },
  {
    "task": "cet6-022",
    "index": 58,
    "word": "convey",
    "en": "Her handwritten note conveyed sincere gratitude to the volunteers.",
    "cn": "她的手写便条向志愿者表达了真挚的谢意。",
    "sourceLine": 498,
    "sourceRaw": "convey [kənˈveɪ] v. 1. 运输，运送 2. 传达，传递",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 运输，运送 2. 传达，传递"
    },
    "original": {
      "pos": "v.",
      "meaning": "1. 运输，运送 2. 传达，传递",
      "phonetic": "kənˈveɪ",
      "example": "A short letter can convey gratitude without using many words.",
      "example_translation": "一封简短的信不必用很多文字就能表达感激。"
    },
    "inputSha": "d5850c992550cd5c43f32a2ac09a522b68b2ade25c5250fa0578fc6822cd057d"
  },
  {
    "task": "cet6-022",
    "index": 60,
    "word": "corporate",
    "en": "The board approved a new corporate policy on remote work.",
    "cn": "董事会批准了一项关于远程办公的公司政策。",
    "sourceLine": 506,
    "sourceRaw": "corporate [ˈkɔːpərət] adj. 1. 团体的，全体的 2. 公司的",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "1. 团体的，全体的 2. 公司的"
    },
    "original": {
      "pos": "adj.",
      "meaning": "1. 团体的，全体的 2. 公司的",
      "phonetic": "ˈkɔːpərət",
      "example": "The report explains the company's new corporate strategy.",
      "example_translation": "这份报告说明了公司的新企业战略。"
    },
    "inputSha": "d5850c992550cd5c43f32a2ac09a522b68b2ade25c5250fa0578fc6822cd057d"
  },
  {
    "task": "cet6-022",
    "index": 66,
    "word": "crash",
    "en": "The shopping trolley rolled down the slope and crashed into a wall.",
    "cn": "购物手推车沿斜坡滑下，撞上了一堵墙。",
    "sourceLine": 526,
    "sourceRaw": "crash [kræʃ] v. 1. 碰撞，坠落 2. 发出撞击(或爆裂)声 3. 失败，垮台，崩溃 n. 1. 碰撞， 坠落 2. 撞击声，爆裂声 3. 失败，垮台，崩溃",
    "selectedSense": {
      "pos": "v.",
      "meaning": "1. 碰撞，坠落 2. 发出撞击(或爆裂)声 3. 失败，垮台，崩溃 n. 1. 碰撞， 坠落 2. 撞击声，爆裂声 3. 失败，垮台，崩溃"
    },
    "original": {
      "pos": "v.",
      "meaning": "1. 碰撞，坠落 2. 发出撞击(或爆裂)声 3. 失败，垮台，崩溃 n. 1. 碰撞， 坠落 2. 撞击声，爆裂声 3. 失败，垮台，崩溃",
      "phonetic": "kræʃ",
      "example": "The empty cart began to roll and might crash into the wall.",
      "example_translation": "空推车开始滑动，可能会撞上墙。"
    },
    "inputSha": "d5850c992550cd5c43f32a2ac09a522b68b2ade25c5250fa0578fc6822cd057d"
  },
  {
    "task": "cet6-023",
    "index": 9,
    "word": "disaster",
    "en": "The earthquake was a disaster for the coastal town, leaving hundreds homeless.",
    "cn": "这场地震给沿海小镇带来灾难，导致数百人无家可归。",
    "sourceLine": 652,
    "sourceRaw": "disaster [dɪˈzɑːstə] n. 1. 灾难，大祸，大不幸 2. 彻底的失败 3. 祸患",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 灾难，大祸，大不幸 2. 彻底的失败 3. 祸患"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 灾难，大祸，大不幸 2. 彻底的失败 3. 祸患",
      "phonetic": "dɪˈzɑːstə",
      "example": "The town rebuilt the bridge after the disaster.",
      "example_translation": "灾难过后，小镇重建了这座桥。"
    },
    "inputSha": "00aedd133dd5e4dd81d699cf56eafb654628da8280a29829293ac586834773ec"
  },
  {
    "task": "cet6-023",
    "index": 20,
    "word": "domain",
    "en": "Cybersecurity has become an important domain of computer science.",
    "cn": "网络安全已成为计算机科学的重要领域。",
    "sourceLine": 699,
    "sourceRaw": "domain [dəʊˈmeɪn] n. 1. 领域，范围，范畴 2. 领土，领地，势力范围",
    "selectedSense": {
      "pos": "n.",
      "meaning": "1. 领域，范围，范畴 2. 领土，领地，势力范围"
    },
    "original": {
      "pos": "n.",
      "meaning": "1. 领域，范围，范畴 2. 领土，领地，势力范围",
      "phonetic": "dəʊˈmeɪn",
      "example": "This question belongs to the domain of environmental science.",
      "example_translation": "这个问题属于环境科学领域。"
    },
    "inputSha": "00aedd133dd5e4dd81d699cf56eafb654628da8280a29829293ac586834773ec"
  },
  {
    "task": "cet6-023",
    "index": 26,
    "word": "dramatic",
    "en": "The new bridge brought a dramatic reduction in travel time.",
    "cn": "新桥使出行时间大幅缩短。",
    "sourceLine": 712,
    "sourceRaw": "dramatic [drəˈmætɪk] adj.  1. 戏剧(性)的，刺激的，激动人心的 2. 引人注目的，印象深刻的，突然的",
    "selectedSense": {
      "pos": "adj.",
      "meaning": "1. 戏剧(性)的，刺激的，激动人心的 2. 引人注目的，印象深刻的，突然的"
    },
    "original": {
      "pos": "adj.",
      "meaning": "1. 戏剧(性)的，刺激的，激动人心的 2. 引人注目的，印象深刻的，突然的",
      "phonetic": "drəˈmætɪk",
      "example": "The new bridge caused a dramatic change in travel times.",
      "example_translation": "新桥使出行时间发生了显著变化。"
    },
    "inputSha": "00aedd133dd5e4dd81d699cf56eafb654628da8280a29829293ac586834773ec"
  }
];
test('CET-6: nine source-locked bilingual edits remain review-only',()=>{
 assert.equal(expected.length,9);
 assert.equal(new Set(expected.map(x=>x.task+':'+x.index)).size,9);
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
