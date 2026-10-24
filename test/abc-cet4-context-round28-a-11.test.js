'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected=[
  {
    "task": "cet4-038",
    "index": 0,
    "word": "able",
    "en": "With his neighbour's help, he was able to repair the bicycle.",
    "cn": "在邻居的帮助下，他终于修好了自行车。",
    "sourceLine": 9,
    "sourceRaw": "able [ˈeibl] a.有能力的；出色的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "有能力的；出色的"
    },
    "original": {
      "pos": "a.",
      "meaning": "有能力的；出色的",
      "phonetic": "ˈeibl",
      "example": "With a little help, he was able to repair the bicycle.",
      "example_translation": "在一点帮助下，他修好了自行车。"
    },
    "inputSha": "60a377b403cc6d8c4dda9d3044e7761e2e2b4c90456ac827c895f071b848a750"
  },
  {
    "task": "cet4-038",
    "index": 12,
    "word": "accent",
    "en": "Her strong regional accent made the recording difficult for me to understand.",
    "cn": "她浓重的地方口音让我很难听懂这段录音。",
    "sourceLine": 27,
    "sourceRaw": "accent [ˈæksənt] n.口音，腔调；重音",
    "selectedSense": {
      "pos": "n.",
      "meaning": "口音，腔调；重音"
    },
    "original": {
      "pos": "n.",
      "meaning": "口音，腔调；重音",
      "phonetic": "ˈæksənt",
      "example": "I recognized her voice despite her unfamiliar accent.",
      "example_translation": "尽管她的口音陌生，我还是认出了她的声音。"
    },
    "inputSha": "60a377b403cc6d8c4dda9d3044e7761e2e2b4c90456ac827c895f071b848a750"
  },
  {
    "task": "cet4-038",
    "index": 66,
    "word": "airline",
    "en": "The airline moved us to an earlier flight after our original one was cancelled.",
    "cn": "原定航班取消后，航空公司把我们改签到了更早的航班。",
    "sourceLine": 117,
    "sourceRaw": "airline [ˈeəlain] n.航空公司；航线",
    "selectedSense": {
      "pos": "n.",
      "meaning": "航空公司；航线"
    },
    "original": {
      "pos": "n.",
      "meaning": "航空公司；航线",
      "phonetic": "ˈeəlain",
      "example": "The airline changed our flight to an earlier time.",
      "example_translation": "航空公司把我们的航班改到了更早的时间。"
    },
    "inputSha": "60a377b403cc6d8c4dda9d3044e7761e2e2b4c90456ac827c895f071b848a750"
  },
  {
    "task": "cet4-039",
    "index": 5,
    "word": "anything",
    "en": "Is there anything else you need before the meeting?",
    "cn": "开会前你还需要什么东西吗？",
    "sourceLine": 179,
    "sourceRaw": "anything [ˈeniθiŋ] pron.任何事物；一切",
    "selectedSense": {
      "pos": "pron.",
      "meaning": "任何事物；一切"
    },
    "original": {
      "pos": "pron.",
      "meaning": "任何事物；一切",
      "phonetic": "ˈeniθiŋ",
      "example": "Is there anything I can do to help?",
      "example_translation": "有什么我能做的事可以帮上忙吗？"
    },
    "inputSha": "dcf36c29dcea099da445f57fed1ed2608e2cf18f8f00ae7057cc35223aec723a"
  },
  {
    "task": "cet4-039",
    "index": 48,
    "word": "athlete",
    "en": "Each athlete pinned a race number to their shirt before the start.",
    "cn": "比赛开始前，每位运动员都把号码布别在上衣上。",
    "sourceLine": 253,
    "sourceRaw": "athlete [ˈæθliːt] n.运动员；田径运动员",
    "selectedSense": {
      "pos": "n.",
      "meaning": "运动员；田径运动员"
    },
    "original": {
      "pos": "n.",
      "meaning": "运动员；田径运动员",
      "phonetic": "ˈæθliːt",
      "example": "Each athlete must wear a number during the race.",
      "example_translation": "每位运动员比赛时都必须佩戴号码。"
    },
    "inputSha": "dcf36c29dcea099da445f57fed1ed2608e2cf18f8f00ae7057cc35223aec723a"
  },
  {
    "task": "cet4-039",
    "index": 92,
    "word": "basketball",
    "en": "The students play basketball in the gym after school.",
    "cn": "学生们放学后在体育馆打篮球。",
    "sourceLine": 336,
    "sourceRaw": "basketball [ˈbɑːskitbɔːl] n.篮球；篮球运动",
    "selectedSense": {
      "pos": "n.",
      "meaning": "篮球；篮球运动"
    },
    "original": {
      "pos": "n.",
      "meaning": "篮球；篮球运动",
      "phonetic": "ˈbɑːskitbɔːl",
      "example": "They practise basketball after their last lesson.",
      "example_translation": "他们在最后一节课后练习篮球。"
    },
    "inputSha": "dcf36c29dcea099da445f57fed1ed2608e2cf18f8f00ae7057cc35223aec723a"
  },
  {
    "task": "cet4-039",
    "index": 93,
    "word": "bat",
    "en": "The batter gripped the bat tightly as the pitcher prepared to throw.",
    "cn": "投手准备投球时，击球手紧紧握住球棒。",
    "sourceLine": 337,
    "sourceRaw": "bat [bæt] n.球拍；短棍；蝙蝠",
    "selectedSense": {
      "pos": "n.",
      "meaning": "球拍；短棍；蝙蝠"
    },
    "original": {
      "pos": "n.",
      "meaning": "球拍；短棍；蝙蝠",
      "phonetic": "bæt",
      "example": "He held the bat firmly before the next ball.",
      "example_translation": "下一个球投来之前，他紧紧握住球棒。"
    },
    "inputSha": "dcf36c29dcea099da445f57fed1ed2608e2cf18f8f00ae7057cc35223aec723a"
  },
  {
    "task": "cet4-040",
    "index": 16,
    "word": "belief",
    "en": "Even after several setbacks, she never lost her belief in the project.",
    "cn": "即使经历了几次挫折，她对这个项目的信心始终没有动摇。",
    "sourceLine": 373,
    "sourceRaw": "belief [biˈliːf] n.信任，相信；信念",
    "selectedSense": {
      "pos": "n.",
      "meaning": "信任，相信；信念"
    },
    "original": {
      "pos": "n.",
      "meaning": "信任，相信；信念",
      "phonetic": "biˈliːf",
      "example": "Her belief in the project never disappeared.",
      "example_translation": "她对这个项目的信念从未消失。"
    },
    "inputSha": "28b9da9f772e2ecb0c2f8433447e622fe5db32456c2e2af688ba92232ae8a719"
  },
  {
    "task": "cet4-040",
    "index": 33,
    "word": "biology",
    "en": "In biology class, we learned how plants convert sunlight into chemical energy.",
    "cn": "在生物课上，我们学习了植物如何将阳光转化为化学能。",
    "sourceLine": 401,
    "sourceRaw": "biology [baiˈɔlədʒi] n.生物学；生态学",
    "selectedSense": {
      "pos": "n.",
      "meaning": "生物学；生态学"
    },
    "original": {
      "pos": "n.",
      "meaning": "生物学；生态学",
      "phonetic": "baiˈɔlədʒi",
      "example": "In biology, we learn how plants obtain energy.",
      "example_translation": "在生物课上，我们学习植物如何获取能量。"
    },
    "inputSha": "28b9da9f772e2ecb0c2f8433447e622fe5db32456c2e2af688ba92232ae8a719"
  },
  {
    "task": "cet4-040",
    "index": 46,
    "word": "bleed",
    "en": "His finger began to bleed after he cut it on a sharp edge.",
    "cn": "他的手指被锋利的边缘划伤后开始流血。",
    "sourceLine": 418,
    "sourceRaw": "bleed [bliːd] vi.出血，流血；泌脂",
    "selectedSense": {
      "pos": "vi.",
      "meaning": "出血，流血；泌脂"
    },
    "original": {
      "pos": "vi.",
      "meaning": "出血，流血；泌脂",
      "phonetic": "bliːd",
      "example": "The small cut continued to bleed for a moment.",
      "example_translation": "那道小伤口又流了一会儿血。"
    },
    "inputSha": "28b9da9f772e2ecb0c2f8433447e622fe5db32456c2e2af688ba92232ae8a719"
  },
  {
    "task": "cet4-040",
    "index": 59,
    "word": "bone",
    "en": "The museum displayed a fossilized dinosaur bone found nearby.",
    "cn": "博物馆展出了一块在附近发现的恐龙骨骼化石。",
    "sourceLine": 437,
    "sourceRaw": "bone [bəun] n.骨，骨骼",
    "selectedSense": {
      "pos": "n.",
      "meaning": "骨，骨骼"
    },
    "original": {
      "pos": "n.",
      "meaning": "骨，骨骼",
      "phonetic": "bəun",
      "example": "The museum displayed the bone of a large ancient animal.",
      "example_translation": "博物馆展出了一块大型古代动物的骨头。"
    },
    "inputSha": "28b9da9f772e2ecb0c2f8433447e622fe5db32456c2e2af688ba92232ae8a719"
  }
];
test('CET-4: 11 source-locked bilingual edits remain review-only',()=>{
 assert.equal(expected.length,11);
 assert.equal(new Set(expected.map(x=>x.task+':'+x.index)).size,11);
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
