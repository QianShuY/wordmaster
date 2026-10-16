'use strict';
const fs=require('node:fs'),path=require('node:path'),V=require('../app/vocabulary');
const root=path.resolve(__dirname,'..'),file=path.join(root,'docs/vocabulary-audit/i-meanings-original-20261015.json'),deferred=require('../app/seed/examples-common-i-reviewed-20261015.json').deferred;
let baseline;if(fs.existsSync(file))baseline=JSON.parse(fs.readFileSync(file,'utf8'));else{baseline=deferred.map(p=>V.buildBook(V.CATALOG.find(s=>s.file===p.source_file)).words.find(w=>w.word===p.word));fs.writeFileSync(file,JSON.stringify(baseline,null,2)+'\n');}
const teaching=new Map(require('../docs/vocabulary-audit/gaokao-reviewed-units-current.json').entries.map(e=>[e.headword,e]));
const meanings={
 'cet4.txt:diverse':'不一样的，相异的；多种多样的','cet4.txt:duration':'持续时间，期间',
 'cet4.txt:dress':'连衣裙；女服，童装；服装','npee.txt:dress':'连衣裙；服装，童装，女装 v. 穿衣，打扮',
 'cet4.txt:drive':'驾驶；打入；驱 vi. 驾驶（汽车）',
 'cet6.txt:electric':'1. 电的；用电的，电动的；导电的，发电的 2. 令人兴奋的，刺激的',
 'tem.txt:electric':'1. 电的；用电的，电动的；导电的，发电的 2. 令人兴奋的，刺激的',
 'npee.txt:dismiss':'免职，解雇，开除，解散；不予考虑，摒弃（想法等）','npee.txt:donate':'捐赠（金钱等）；赠予',
 'tem.txt:elderly':'上了年纪的，老年的',
 'cet6.txt:efficient':'效率高的，办事有效率的；有能力的，能胜任的（强调节省时间、精力或资源） || 用法：与 effective（有效的）区分，efficient 强调效率与不浪费资源。',
 'tem.txt:efficient':'效率高的，办事有效率的；有能力的，能胜任的（强调节省时间、精力或资源） || 用法：与 effective（有效的）区分，efficient 强调效率与不浪费资源。'};
const patches=baseline.map(w=>{if(!w)throw Error('Missing frozen source');const e=teaching.get(w.word),meaning=meanings[w.source_file+':'+w.word],raw=fs.readFileSync(path.join(root,'app/seed',w.source_file),'utf8').split(/\r?\n/)[w.source_line-1];if(raw!==w.source_raw||!meaning||!e)throw Error('Source or teaching differs');return {word:w.word,headword:w.headword,homograph:w.homograph,source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw,from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{meaning},source:e.pronunciation_source,example:{text:e.example,translation:e.example_translation},review_method:'Codex source-bound selected-sense correction; explicit efficient/effective and elderly/middle-age distinctions; original source retained',external_human_review:false,full_dictionary_senses_reviewed:false};});
if(patches.length!==12)throw Error('Expected twelve corrections');fs.writeFileSync(path.join(root,'app/seed/meanings-i-reviewed-20261015.json'),JSON.stringify(patches,null,2)+'\n');console.log(JSON.stringify({corrections:patches.length}));
