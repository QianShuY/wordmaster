'use strict';
const fs=require('node:fs'),path=require('node:path'),V=require('../app/vocabulary');
const root=path.resolve(__dirname,'..'),file=path.join(root,'docs/vocabulary-audit/g-meanings-original-20261015.json');
const deferred=require('../app/seed/examples-common-g-reviewed-20261015.json').deferred;
let baseline;if(fs.existsSync(file))baseline=JSON.parse(fs.readFileSync(file,'utf8'));else{baseline=deferred.map(p=>V.buildBook(V.CATALOG.find(s=>s.file===p.source_file)).words.find(w=>w.word===p.word));fs.writeFileSync(file,JSON.stringify(baseline,null,2)+'\n');}
const teaching=new Map(require('../docs/vocabulary-audit/gaokao-reviewed-units-current.json').entries.map(e=>[e.headword,e]));
const meanings={conventional:'传统的；常规的；符合习俗的',convey:'传送；运送；传达，表达（思想、感情等）',corn:'玉米（美式常用）；谷物（英式可指小麦等）',count:'数，清点；计算 vi. 数数，计数',crew:'全体船员；全体机组人员',cuisine:'烹饪风格；菜肴'};
const creditSuffix='；赞扬，认可（因作出贡献等）';
const patches=baseline.map(w=>{if(!w)throw Error('Missing frozen source');const e=teaching.get(w.word),raw=fs.readFileSync(path.join(root,'app/seed',w.source_file),'utf8').split(/\r?\n/)[w.source_line-1];if(raw!==w.source_raw)throw Error('Source changed');const meaning=w.word==='credit'?w.meaning.replace(' ||',''+creditSuffix+' ||')+(w.meaning.includes(' ||')?'':creditSuffix):meanings[w.word];if(!meaning||!e)throw Error('Missing own correction');return {word:w.word,headword:w.headword,homograph:w.homograph,source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw,from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{meaning},source:e.pronunciation_source,example:{text:e.example,translation:e.example_translation},review_method:'Codex selected-sense and valency correction; preceding symbol normalization retained; original raw source immutable',external_human_review:false,full_dictionary_senses_reviewed:false};});
if(patches.length!==9)throw Error('Expected nine source-bound corrections');
fs.writeFileSync(path.join(root,'app/seed/meanings-g-reviewed-20261015.json'),JSON.stringify(patches,null,2)+'\n');console.log(JSON.stringify({corrections:patches.length}));
