'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {rules}=require('../scripts/audit-abc-example-quality');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/model-tasks-20261015/manifest.json'),'utf8'));
const expected=[
  {
    "task": "cet4-044",
    "index": 16,
    "word": "destroy",
    "en": "The wildfire destroyed several wooden houses near the forest.",
    "cn": "野火烧毁了森林附近的几栋木屋。",
    "sourceLine": 1059,
    "sourceRaw": "destroy [disˈtrɔi] vt.破坏；消灭；打破",
    "selectedSense": {
      "pos": "vt.",
      "meaning": "破坏；消灭；打破"
    },
    "original": {
      "pos": "vt.",
      "meaning": "破坏；消灭；打破",
      "phonetic": "disˈtrɔi",
      "example": "A single spark can destroy a dry wooden shelter.",
      "example_translation": "一颗火星就可能毁掉一个干燥的木制棚屋。"
    },
    "inputSha": "c6b03727f8d3987a2e6c2cf75d85bfa27301860d5b4e478c7fe4f6f94fe23799"
  },
  {
    "task": "cet4-044",
    "index": 80,
    "word": "dramatic",
    "en": "The new bridge brought a dramatic reduction in travel time.",
    "cn": "新桥使出行时间大幅缩短。",
    "sourceLine": 1176,
    "sourceRaw": "dramatic [drəˈmætik] a.引人注目的，戏剧的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "引人注目的，戏剧的"
    },
    "original": {
      "pos": "a.",
      "meaning": "引人注目的，戏剧的",
      "phonetic": "drəˈmætik",
      "example": "The new bridge caused a dramatic change in travel times.",
      "example_translation": "新桥使出行时间发生了显著变化。"
    },
    "inputSha": "c6b03727f8d3987a2e6c2cf75d85bfa27301860d5b4e478c7fe4f6f94fe23799"
  },
  {
    "task": "cet4-044",
    "index": 87,
    "word": "driver",
    "en": "The bus driver checked the route map before leaving the depot.",
    "cn": "公交车司机离开车库前查看了线路图。",
    "sourceLine": 1188,
    "sourceRaw": "driver [ˈdraivə] n.驾驶员，司机",
    "selectedSense": {
      "pos": "n.",
      "meaning": "驾驶员，司机"
    },
    "original": {
      "pos": "n.",
      "meaning": "驾驶员，司机",
      "phonetic": "ˈdraivə",
      "example": "The driver checked the route before starting the bus.",
      "example_translation": "司机在启动公交车前检查了路线。"
    },
    "inputSha": "c6b03727f8d3987a2e6c2cf75d85bfa27301860d5b4e478c7fe4f6f94fe23799"
  },
  {
    "task": "cet4-045",
    "index": 8,
    "word": "eastern",
    "en": "A strong wind blew across the eastern coast overnight.",
    "cn": "一夜之间，强风席卷了东部海岸。",
    "sourceLine": 1226,
    "sourceRaw": "eastern [ˈiːstən] a.东方的；朝东的",
    "selectedSense": {
      "pos": "a.",
      "meaning": "东方的；朝东的"
    },
    "original": {
      "pos": "a.",
      "meaning": "东方的；朝东的",
      "phonetic": "ˈiːstən",
      "example": "The eastern side of the lake receives sunlight first.",
      "example_translation": "湖的东侧最先照到阳光。"
    },
    "inputSha": "e9d6e50bce8b9bf1a1eea9808641f073ee17153a53eaf64ea33024e6bf1c51d4"
  }
];
test('CET-4: four source-locked bilingual edits remain review-only',()=>{
 assert.equal(expected.length,4);
 assert.equal(new Set(expected.map(x=>x.task+':'+x.index)).size,4);
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
