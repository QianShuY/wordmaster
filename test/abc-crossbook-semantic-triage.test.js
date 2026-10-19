'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const {triage,compareMeaning}=require('../scripts/triage-abc-crossbook-senses');
test('lexical review prioritizer distinguishes a likely sense conflict from an overlapping sense',()=>{
 const agreement=compareMeaning('严厉的','老师严厉批评了这个行为。');
 const mismatch=compareMeaning('注意力，专心','盐的浓度提高了。');
 assert.ok(agreement.shared_pair_count>0);
 assert.equal(mismatch.shared_pair_count,0);
 assert.equal(mismatch.shared_character_count,0);
});
test('crossbook triage scans exactly all drafts without pretending lexical overlap is verification',()=>{
 const report=triage(ROOT,{save:false,maxExamples:15});
 assert.equal(report.total_proposals,26612);
 assert.ok(report.crossbook_to_review>5000);
 assert.ok(report.ranked_rows>0);
 assert.equal(report.installed,0);
 assert.equal(report.approved,0);
 assert.equal(report.independently_verified_senses,0);
 assert.ok(report.high_priority_examples.length<=15);
 assert.ok(report.high_priority_examples.every(e=>
  e.current_draft_method==='crossbook-sense-unverified'&&
  e.approved===false&&e.priority>0&&
  e.source_meaning&&e.word));
 assert.ok(report.high_priority_examples.every((e,i,a)=>i===0||a[i-1].priority>=e.priority));
});
