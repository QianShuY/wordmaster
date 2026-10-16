'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{load,extend}=require('../scripts/extend-gaokao-reviewed'),Policy=require('../shared/answer-policy');
test('continuous ledger includes pronoun I and the next hundred exact source identities with selected-POS evidence',()=>{
 const x=load(),r=extend(x.scope,x.previous,x.rows,x.phonetics),byHead=new Map(r.new_batch.map(e=>[e.headword,e]));
 assert.equal(r.selected_senses_reviewed,254);assert.equal(r.pending_units,2857);assert.equal(r.learning_units,3111);assert.equal(r.installed_units,0);
 assert.equal(r.coverage.filter(x=>x.review_status==='selected-sense-reviewed-not-installed').length,254);
 for(const e of r.new_batch){assert.equal(e.external_human_review,false);assert.ok(Policy.grade(e.answer_policy,e.headword));}
 assert.equal(byHead.get('I').pos,'pron.');assert.equal(byHead.get('I').phonetic,'aɪ');assert.equal(byHead.get('I').pdf_page,101);
 assert.equal(Policy.grade(byHead.get('I').answer_policy,'me'),false);
 assert.equal(byHead.get('another').pos,'det.');assert.equal(byHead.get('any').pos,'pron.');
 assert.equal(byHead.get('appropriate').phonetic,'əˈprəʊpriət');assert.equal(byHead.get('approach').pos,'v.');
 assert.equal(byHead.get('Atlantic').pronunciation_source,'https://www.collinsdictionary.com/dictionary/english/atlantic');
 assert.equal(byHead.get('ant').phonetic,'ænt');assert.equal(byHead.get('aunt').phonetic,'ɑːnt');
 let changed=structuredClone(x);changed.rows.pop();assert.throws(()=>extend(changed.scope,changed.previous,changed.rows,changed.phonetics),/101 unique/);
 changed=structuredClone(x);changed.phonetics.find(p=>p.headword==='another').pos_label='pronoun';assert.throws(()=>extend(changed.scope,changed.previous,changed.rows,changed.phonetics),/POS mismatch/);
 changed=structuredClone(x);changed.rows.at(-1).headword='me';assert.throws(()=>extend(changed.scope,changed.previous,changed.rows,changed.phonetics),/headword mismatch/);
});
