'use strict';
const fs=require('node:fs'),path=require('node:path'),V=require('../app/vocabulary');
const file=path.resolve(__dirname,'../app/seed/phonetic-symbols-20261015.json');
if(fs.existsSync(file))throw Error('Frozen symbol baseline already exists; do not regenerate from corrected builds');
const patches=[];
for(const spec of V.CATALOG.filter(s=>s.file!=='zhongkao.txt'))for(const w of V.buildBook(spec).words)if(w.phonetic.includes('∫'))patches.push({source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw,word:w.word,headword:w.headword,homograph:w.homograph,from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{phonetic:w.phonetic.replaceAll('∫','ʃ')},review_method:'Legacy typography normalization only: U+222B integral to IPA U+0283. No phoneme, stress or sense approval.',source:'https://www.internationalphoneticassociation.org/IPAcharts/IPA_charts_EI/IPA_charts_EI.html',full_pronunciation_reviewed:false,external_human_review:false});
if(patches.length!==488)throw Error('Unexpected reviewed source population: '+patches.length);
fs.writeFileSync(file,JSON.stringify(patches,null,2)+'\n');console.log(JSON.stringify({patches:patches.length,file}));
