'use strict';
// This file records selected dictionary facts; it does not scrape or approve all senses.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const inventory=require('../docs/vocabulary-audit/missing-phonetics-original-20261014.json');
const evidence=require('../docs/vocabulary-audit/missing-ipa-evidence-20261014.json');
const ox='https://www.oxfordlearnersdictionaries.com/definition/english/';
const co='https://www.collinsdictionary.com/dictionary/english/';
const additions=[
 ['Bible','noun','ˈbaɪbl','bible'],['bush','noun','bʊʃ','bush'],['Christ','noun','kraɪst','christ_1'],
 ['coke','noun','kəʊk','coke'],['dean','noun','diːn','dean_1'],['e-mail','noun','ˈiːmeɪl','email_1'],
 ['found','verb','faʊnd','found'],['hinder','verb','ˈhɪndə(r)','hinder'],['if','conjunction','ɪf','if_1'],
 ['illegal','adjective','ɪˈliːɡl','illegal_1'],['labor','noun','ˈleɪbə(r)','labour_1'],
 ['liver','noun','ˈlɪvə(r)','liver'],['marvelous','adjective','ˈmɑːvələs','marvellous'],
 ['Marxist','adjective','ˈmɑːksɪst','marxist_2'],['Christian','noun','ˈkrɪstʃən','christian_2'],
 ['rent','verb','rent','rent_2'],['saving','noun','ˈseɪvɪŋ','saving'],['X-ray','noun','ˈeks reɪ','x-ray_2'],
 ['add-on','noun','ˈæd ɒn','add-on_2'],['march','verb','mɑːtʃ','march_1'],
].map(([headword,pos_label,phonetic,slug])=>({headword,pos_label,phonetic,url:ox+slug}));
additions.push(...[
 ['grown-up','adjective','ˌɡrəʊnˈʌp','grown-up'],['leading','adjective','ˈliːdɪŋ','leading'],
 ['okay','adjective','ˌəʊˈkeɪ','okay'],['lower','adjective','ˈləʊə','lower'],
].map(([headword,pos_label,phonetic,slug])=>({headword,pos_label,phonetic,url:co+slug})));
const preferred={approximate:'adjective',transfer:'verb',transport:'verb',Christian:'noun',Marxist:'adjective',rent:'verb',march:'verb','X-ray':'noun'};
const canonical={'living-room':'living room','well-known':'well known','air-conditioning':'air conditioning',Thanksgiving:'thanksgiving'};
const all=[...evidence,...additions];
const meanings={
 approximate:'近似的 [əˈprɒksɪmeɪt] vi. (to)接近；近似于',
 'grown-up':'成长的，成熟的，成人的 [ˈɡrəʊnʌp] n. 成年人',
 hinder:'(from)阻止，妨碍 [ˈhaɪndə] a. 后面的',
 transfer:'v. 转移；转换；转让；迁移；改乘 [ˈtrænsfɜː(r)] n. 转移；转让；过户；换乘',
 transport:'运输，运送，搬运 [ˈtrænspɔːt] n. 运输；运输系统；运载工具',
 Negro:'黑人（英语过时且带冒犯性的旧称） a. 黑人的（过时且带冒犯性） || 用法：用于理解旧文本；现代称呼宜使用中性的 Black person 等表达。',
 oriental:'东方的，东方诸国的（旧用法；指人时可能冒犯） n. 东方人（旧称，可能冒犯） || 用法：现代描述人宜使用具体地区或国籍称谓；阅读旧文本注意时代背景。',
};
const notes={
 a:'Primary IPA is the weak form; strong form /eɪ/. This entry is a, not an.',
 as:'Primary IPA is weak /əz/; strong /æz/. The source combines adverb, conjunction and preposition.',
 the:'Weak /ðə/ before consonants, /ði/ before vowels; strong /ðiː/.',
 my:'Legacy source calls the possessive form a pronoun; dictionary classifies this use as a determiner.',
 may:'Source v. aux. corresponds to dictionary modal verb; not the month May.',
 Bible:'Dictionary head is bible; scripture sense is explicitly the Bible.',
 Catholic:'Dictionary catholic_1 includes the capitalized Roman Catholic sense, not only broad-minded.',
 Thanksgiving:'Dictionary thanksgiving includes the capitalized holiday Thanksgiving (Day).',
 'e-mail':'Dictionary email_1 explicitly also e-mail; source identity and spelling remain unchanged.',
 labor:'British IPA is checked under labour, the spelling variant explicitly present in source.',
 marvelous:'British IPA is checked under marvellous, the variant explicitly present in source.',
 'grown-up':'Collins In other languages distinguishes adjective /ˌɡrəʊnˈʌp/ and noun /ˈɡrəʊnʌp/.',
 hinder:'Oxford verb /ˈhɪndə(r)/; Collins British English 2 adjective /ˈhaɪndə/.',
 leading:'Adjective /ˈliːdɪŋ/; printing noun /ˈledɪŋ/ is not this source entry.',
 lower:'Collins British English 1 adjective and lowering verb /ˈləʊə/; weather homograph /ˈlaʊə/ excluded.',
};
const patches=inventory.items.filter(w=>w.source_file!=='zhongkao.txt').map(w=>{
 const head=canonical[w.word]||w.word;
 const candidates=all.filter(e=>e.headword.toLowerCase()===head.toLowerCase());
 const chosen=[...candidates].reverse().find(e=>!preferred[w.word]||e.pos_label===preferred[w.word]);
 assert.ok(chosen?.phonetic,'Missing dictionary evidence for '+w.word);
 return {word:w.word,headword:w.headword,homograph:null,source_file:w.source_file,source_line:w.source_line,source_raw:w.source_raw,
  from:{pos:w.pos,meaning:w.meaning,phonetic:w.phonetic},to:{phonetic:chosen.phonetic,...(meanings[w.word]?{meaning:meanings[w.word]}:{})},
  source:chosen.url, dictionary_pos:chosen.pos_label,review:'primary-pos-british-pronunciation-with-explicit-polyphonic-groups',
  additional_sources: w.word==='hinder'?[co+'hinder']:w.word==='transfer'?[ox+'transfer_2']:w.word==='transport'?[ox+'transport_1']:[],
  note:notes[w.word]||'Selected primary pronunciation only; all other dictionary senses and examples remain outside this approval.',
  external_human_review:false};
});
assert.equal(patches.length,102);assert.equal(new Set(patches.map(p=>p.source_file+'\0'+p.source_line)).size,102);
fs.writeFileSync(path.join(root,'app/seed/phonetics-missing-reviewed-20261014.json'),JSON.stringify(patches,null,2)+'\n');
console.log(JSON.stringify({source_bound_patches:patches.length,polyphonic_or_usage_meanings:patches.filter(p=>p.to.meaning).length}));
