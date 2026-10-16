'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {handling,readGap,prepare}=require('../scripts/prepare-gaokao-review');
const scope=require('../docs/vocabulary-audit/gaokao-2025-scope.json');
const gaps=readGap(path.join(__dirname,'../app/seed/gaokao-gap-examples-20261013.tsv'));
test('Gaokao review separates source groups from learning units without fabricating the declared total',()=>{
 const draft=prepare(scope,gaps);assert.equal(draft.status,'review-draft-not-installed');assert.equal(draft.source_entries,3099);assert.equal(draft.learning_units,3111);assert.equal(draft.declared_words,3100);
 assert.equal(draft.items.filter(x=>x.handling.type==='split-headwords').length,12);assert.equal(draft.authored_selected_senses,53);assert.equal(draft.units_with_candidate_or_authored,3111);
 assert.equal(draft.items.length,scope.items.length);assert.ok(draft.install_blockers.length>=4);
 for(let i=0;i<scope.items.length;i++){assert.equal(draft.items[i].source_entry,scope.items[i].source_entry);assert.equal(draft.items[i].pdf_page,scope.items[i].pdf_page);}
 assert.ok(draft.items.flatMap(x=>x.learning_units).every(x=>x.review_status==='pending-full-sense-and-phonetic-review'));
 const country=draft.items.find(x=>x.headword==='China').learning_units[0],porcelain=draft.items.find(x=>x.headword==='china').learning_units[0];
 assert.ok(country.candidates.length&&porcelain.candidates.length);
 assert.ok(country.candidates.every(x=>x.meaning.includes('中国')&&!x.meaning.includes('瓷')));
 assert.ok(porcelain.candidates.every(x=>x.meaning.includes('瓷')&&!x.meaning.includes('中国')));
 assert.throws(()=>prepare({...scope,pdf_sha256:'other-edition'},gaps),/Scope evidence/);
 const changed=structuredClone(scope);changed.items[0].source_entry='silently changed';assert.throws(()=>prepare(changed,gaps),/Scope evidence/);
});
test('variants never confuse gender, inflections, fixed complements, abbreviation expansions or noun and verb practice',()=>{
 const rule=head=>handling(scope.items.find(x=>x.headword===head));
 assert.deepEqual(rule('be').units[0].accepted_spellings,['be']);assert.ok(rule('be').related_forms.includes('am'));
 assert.deepEqual(rule('according').units[0],{headword:'according to',accepted_spellings:['according to']});
 assert.deepEqual(rule('colour').units[0].accepted_spellings,['colour','color']);
 assert.deepEqual(rule('practise').units[0].accepted_spellings,['practise']);assert.equal(rule('practise').type,'context-limited-variant');
 assert.deepEqual(rule('AI').units[0].accepted_spellings,['AI']);assert.ok(rule('AI').related_forms.includes('artificial intelligence'));
 assert.deepEqual(rule('Mr').units[0].accepted_spellings,['Mr','Mr.']);
 assert.deepEqual(rule('bride/bridegroom').units.map(x=>x.accepted_spellings),[['bride'],['bridegroom']]);
 assert.deepEqual(rule('humourous').units[0].accepted_spellings,['humorous']);assert.equal(rule('humourous').rejected_source_spelling,'humourous');
 assert.throws(()=>handling({headword:'unknown',variants:['other'],source_entry:'unknown (other)'}),/Unreviewed/);
});
test('every authored gap has its own bilingual selected sense, and binds to an exact scope headword',()=>{
 assert.equal(new Set(gaps.map(x=>x.source_headword+'|'+x.teaching_headword)).size,53);
 for(const row of gaps){assert.ok(/[\u3400-\u9fff]/.test(row.meaning));assert.ok(/[\u3400-\u9fff]/.test(row.example_translation));assert.ok(row.example.toLowerCase().includes(row.teaching_headword.toLowerCase()));assert.ok(row.pos.endsWith('.'));}
 const statistic=gaps.find(x=>x.source_headword==='statistic');assert.ok(statistic.meaning.includes('一项统计数据'));assert.ok(!statistic.meaning.includes('统计学'));
 assert.throws(()=>prepare(scope,[...gaps,{...gaps[0],source_headword:'not-in-the-source'}]),/not present/);
 assert.throws(()=>prepare(scope,gaps.map((x,i)=>i===0?{...x,teaching_headword:'according'}:x)),/mismatch/);
});
