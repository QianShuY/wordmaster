'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const Policy=require('../shared/answer-policy'),{complete,readPhonetics}=require('../scripts/complete-gaokao-selected'),{readGap}=require('../scripts/prepare-gaokao-review');
const scope=require('../docs/vocabulary-audit/gaokao-2025-scope.json'),seed=path.join(__dirname,'../app/seed');
const gaps=readGap(path.join(seed,'gaokao-gap-examples-20261013.tsv')),phonetics=readPhonetics(path.join(seed,'gaokao-phonetics-20261013.tsv'));
test('all 53 selected senses have scoped pronunciation, evidence and spelling policies without claiming installation',()=>{
 const draft=complete(scope,gaps,phonetics),byHead=new Map(draft.entries.map(e=>[e.headword,e]));
 assert.equal(draft.entries_count,53);assert.equal(draft.status,'selected-sense-reviewed-not-installed');
 for(const row of draft.entries){assert.ok(row.phonetic);assert.ok(row.pronunciation_source.startsWith('https://'));assert.equal(row.full_dictionary_senses_reviewed,false);assert.ok(Policy.grade(row.answer_policy,row.headword));}
 assert.equal(byHead.get('Mr').phonetic,'ˈmɪstə(r)');assert.equal(byHead.get('Ms').phonetic,'mɪz');assert.notEqual(byHead.get('Ms').phonetic,'ˌem ˈes');
 assert.equal(byHead.get('statistic').phonetic,'stəˈtɪstɪk');assert.equal(byHead.get('surrounding').phonetic,'səˈraʊndɪŋ');
 for(const [word,answer] of [['café','cafe'],['café','cafe\u0301'],['behaviour','behavior'],['colour','color'],['email','e-mail'],['yoghurt','yogurt'],['BCE','B.C.E.'],['CE','C.E.'],['Mr','Mr.'],['a.m.','am'],['p.m.','pm'],["o'clock",'o’clock'],['per cent','percent'],['according to','  According   to  ']])assert.ok(Policy.grade(byHead.get(word).answer_policy,answer),word+' / '+answer);
 for(const [word,answer] of [['AI','artificial intelligence'],['PE','physical education'],['humorous','humourous'],['statistic','statistics'],['surrounding','surroundings'],['according to','according'],['chairwoman','chairman'],['Mr','Mrs'],['Ms','Miss'],['Wi-Fi','Wi Fi']])assert.equal(Policy.grade(byHead.get(word).answer_policy,answer),false,word+' / '+answer);
 assert.throws(()=>complete(scope,gaps,phonetics.slice(1)),/Missing verified/);
 assert.throws(()=>complete(scope,gaps,[...phonetics,phonetics[0]]),/Duplicate/);
 assert.throws(()=>complete(scope,gaps,phonetics.map((p,i)=>i===0?{...p,url:'https://unreviewed.example/dictionary'}:p)),/Unexpected/);
});
test('normalisation is explicit: no global accent, punctuation, apostrophe or hyphen stripping',()=>{
 assert.equal(Policy.grade(Policy.create('résumé'),'resume'),false);
 assert.equal(Policy.grade(Policy.create('a.m.'),'am'),false);
 assert.equal(Policy.grade(Policy.create("o'clock"),'oclock'),false);
 assert.equal(Policy.grade(Policy.create('Wi-Fi'),'wifi'),false);
 assert.equal(Policy.grade(Policy.create('be'),'am'),false);
 assert.equal(Policy.grade(null,'be'),false);
 assert.throws(()=>Policy.create('bridge',['river']),/Conflicting/);
 assert.throws(()=>Policy.create('humorous',['humorous','humourous'],['humourous']),/Conflicting/);
 assert.throws(()=>Policy.create('bridge',['bridge','бридж']),/Invalid/);
});
