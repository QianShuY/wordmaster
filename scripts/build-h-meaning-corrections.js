'use strict';
const fs=require('node:fs'),path=require('node:path'),V=require('../app/vocabulary');
const root=path.resolve(__dirname,'..'),file=path.join(root,'docs/vocabulary-audit/h-meanings-original-20261015.json'),deferred=require('../app/seed/examples-common-h-reviewed-20261015.json').deferred;
let baseline;if(fs.existsSync(file))baseline=JSON.parse(fs.readFileSync(file,'utf8'));else{baseline=deferred.map(p=>V.buildBook(V.CATALOG.find(s=>s.file===p.source_file)).words.find(w=>w.word===p.word));fs.writeFileSync(file,JSON.stringify(baseline,null,2)+'\n');}
const teaching=new Map(require('../docs/vocabulary-audit/gaokao-reviewed-units-current.json').entries.map(e=>[e.headword,e]));
const replacements={
 'cet4.txt:decent':'正派的；体面的，得体的；像样的，尚好的','npee.txt:decent':'体面的；正派的，合乎礼仪的；合适的；像样的，尚好的',
 'cet4.txt:demonstrate':'说明；论证；表露；示范，演示','cet4.txt:depend':'依靠，依赖；相信；取决于（常与 on 连用）',
 'cet4.txt:desperate':'拼死的；绝望的；极想要的，急切的（desperate for）',
 'npee.txt:desperate':'不顾一切的，铤而走险的；绝望的，危急的；极想要的，急切的（desperate for）',
 'tem.txt:desperate':'1. 绝望的，孤注一掷的 2. 亡命的，不顾一切的 3. 极想要的，急切的（desperate for）',
 'cet4.txt:develop':'发展；形成；开发；培养（技能等）','npee.txt:develop':'发展，开发，研制；显现，显影；发育，生长；培养（技能等）',
 'cet4.txt:discipline':'纪律；训练；自律，自制力 vt. 训练','npee.txt:discipline':'纪律；学科；自律，自制力',
 'cet4.txt:deny':'否认；否定；拒绝相信','npee.txt:delicate':'纤弱的；精致的；微妙的；灵敏的；易损的，脆弱的',
 'npee.txt:dignity':'（举止、态度等的）庄严，端庄；尊贵，高贵；尊严','npee.txt:disappoint':'使失望；使（希望等）破灭；挫败（计划等）'};
const patches=baseline.map(w=>{if(!w)throw Error('Missing frozen source');const e=teaching.get(w.word),meaning=replacements[w.source_file+':'+w.word],raw=fs.readFileSync(path.join(root,'app/seed',w.source_file),'utf8').split(/\r?\n/)[w.source_line-1];if(raw!==w.source_raw||!meaning||!e)throw Error('Source or reviewed teaching differs');return {word:w.word,headword:w.headword,homograph:w.homograph,source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw,from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{meaning},source:w.word==='depend'?'https://www.oxfordlearnersdictionaries.com/definition/english/depend-on':e.pronunciation_source,example:{text:e.example,translation:e.example_translation},review_method:'Codex selected-sense and valency correction with primary dictionary evidence; original source and other senses retained',external_human_review:false,full_dictionary_senses_reviewed:false};});
if(patches.length!==15)throw Error('Expected fifteen corrections');fs.writeFileSync(path.join(root,'app/seed/meanings-h-reviewed-20261015.json'),JSON.stringify(patches,null,2)+'\n');console.log(JSON.stringify({corrections:patches.length}));
