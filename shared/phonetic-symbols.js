'use strict';
const patches=require('../app/seed/phonetic-symbols-20261015.json');
const index=new Map(patches.map(p=>[p.source_file+'\0'+p.source_line+'\0'+p.word,p]));
function reviewedSymbol(word){
 const p=index.get(word.source_file+'\0'+word.source_line+'\0'+word.word);
 return p&&p.source_raw===word.source_raw&&p.headword===word.headword&&p.homograph===(word.homograph??null)&&p.from.pos===word.pos&&p.from.meaning===word.meaning&&p.from.phonetic===word.phonetic?p:null;
}
function canonicalPhonetic(word){return reviewedSymbol(word)?.to.phonetic||word.phonetic;}
module.exports={reviewedSymbol,canonicalPhonetic};
