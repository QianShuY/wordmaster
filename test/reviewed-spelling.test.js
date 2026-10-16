'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),D=require('../shared/domain'),P=require('../shared/answer-policy');
const B=require('../shared/boss-battle');
test('reviewed variants survive spelling input and queue filtering without stripping punctuation or accents globally',()=>{
 const cafe={word:'café',answer_policy:P.create('café',['café','cafe'])},am={word:'a.m.',answer_policy:P.create('a.m.',['a.m.','am'])},email={word:'email',answer_policy:P.create('email',['email','e-mail'])},after={word:'afterward',answer_policy:P.create('afterward',['afterward','afterwards'])};
 assert.equal(D.spellingWords([cafe,am,email,after]).length,4);
 for(const [word,value] of [[cafe,'cafe\u0301'],[cafe,'cafe'],[am,'A.M.'],[am,'am'],[email,'e-mail'],[after,'afterwards']])assert.equal(D.judgeAnswer('spelling',value,word),true,value);
 assert.equal(D.filterSpellingInput('CAFE\u0301',20,cafe.answer_policy),'café');
 assert.equal(D.filterSpellingInput('A.M.',20,am.answer_policy),'a.m.');
 assert.equal(D.filterSpellingInput('ice ',20,P.create('ice cream')),'ice ');
 assert.equal(D.normalizeSpellingAnswer(' A.M. ',am.answer_policy),'a.m.');
 for(const [word,value] of [[email,'e mail'],[am,'a-m'],[cafe,'c!afe'],[{word:'résumé',answer_policy:P.create('résumé')},'resume']])assert.equal(D.judgeAnswer('spelling',value,word),false);
 assert.equal(D.judgeAnswer('spelling','bridge',{word:'river',answer_policy:P.create('bridge')}),false);
 assert.equal(D.judgeAnswer('spelling','cat',{word:'cat',answer_policy:{version:1,headword:'cat',accepted:['cat'],rejected:['cat']}}),false);
 assert.equal(D.isSpellableWord('café'),false); // Existing unreviewed queue contract stays unchanged.
 assert.equal(B.spellingMatches('cafe',{answer:'café',answer_policy:cafe.answer_policy}),true);
 assert.equal(B.spellingMatches('a-m',{answer:'a.m.',answer_policy:am.answer_policy}),false);
 assert.equal(B.spellingMatches('cafe',{answer:'café'}),false);
});
