'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../app/vocabulary'),D=require('../shared/domain');
const chineseBag=text=>[...String(text).matchAll(/[\u3400-\u9fff]/g)].map(x=>x[0]).sort().join('');
test('all five source formats retain every Chinese meaning character when displaying POS groups and phrase notes',()=>{
 const counts={};
 for(const spec of V.CATALOG){
  const words=V.buildBook(spec).words;counts[spec.file]=words.length;
  for(const word of words){
   const value=D.sampleWordPresentation(word,{is_builtin:1});
   assert.ok(value.meaning_groups.length,word.source_file+':'+word.word);
   assert.equal(value.answer_word,word.headword);
   const texts=[...value.meaning_groups.flatMap(g=>[...g.items,g.phonetic||'']),
    ...D.structureMeaning(word.pos,word.meaning).meaning_notes.map(n=>n.text)];
   assert.equal(chineseBag(texts.join('')),chineseBag(word.meaning),word.source_file+':'+word.word);
  }
 }
 assert.deepEqual(counts,{'zhongkao.txt':1713,'cet4.txt':4460,'cet6.txt':2272,'npee.txt':5384,'tem.txt':12439});
});
