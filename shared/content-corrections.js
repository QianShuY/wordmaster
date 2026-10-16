'use strict';
const patches=[...require('../app/seed/meanings-reviewed-20261014.json'),...require('../app/seed/phonetics-missing-reviewed-20261014.json').filter(p=>p.to.meaning),...require('../app/seed/meanings-deferred-reviewed-20261014.json'),...require('../app/seed/meanings-g-reviewed-20261015.json'),...require('../app/seed/meanings-h-reviewed-20261015.json'),...require('../app/seed/meanings-i-reviewed-20261015.json')];
const index=new Map(patches.map(p=>[p.source_file+'\0'+p.source_line+'\0'+p.word,p]));
function reviewedMeaning(word){
 const p=index.get(word.source_file+'\0'+word.source_line+'\0'+word.word);
 return p&&!word.homograph&&p.source_raw===word.source_raw&&p.headword===word.headword&&p.from.pos===word.pos&&p.from.meaning===word.meaning&&p.from.phonetic===word.phonetic?p:null;
}
function correctedExample(word){
 const p=index.get(word.source_file+'\0'+word.source_line+'\0'+word.word);
 const phonetic=p&&require('./phonetic-symbols').canonicalPhonetic({...word,phonetic:p.to.phonetic||p.from.phonetic});
 return p&&p.example&&!word.homograph&&p.source_raw===word.source_raw&&p.headword===word.headword&&p.from.pos===word.pos&&p.to.meaning===word.meaning&&phonetic===word.phonetic?p.example:null;
}
module.exports={reviewedMeaning,correctedExample};
