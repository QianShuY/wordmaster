'use strict';
// Only the six reviewed source identities may change part of speech. This lookup
// never applies to imports, a different homograph, or locally edited content.
const patches=require('../app/seed/lexical-cet6-reviewed-20261022.json');
const index=new Map(patches.map(p=>[p.source_file+'\0'+p.source_line+'\0'+p.word,p]));
const fields=['pos','meaning','phonetic'];
function binding(word){
 const p=index.get(word.source_file+'\0'+word.source_line+'\0'+word.word);
 return p&&p.source_raw===word.source_raw&&p.headword===word.headword&&p.homograph===(word.homograph??null)?p:null;
}
function reviewedLexical(word){
 const p=binding(word);return p&&fields.every(k=>p.from[k]===word[k])?p:null;
}
function lexicalExample(word){
 const p=binding(word);return p&&fields.every(k=>p.to[k]===word[k])?p.example:null;
}
module.exports={reviewedLexical,lexicalExample};
