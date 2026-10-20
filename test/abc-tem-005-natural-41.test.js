'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const task=JSON.parse(fs.readFileSync('docs/model-task-results/worker-A/tem-005/result.json','utf8'));
const rows=[1,2,4,5,7,12,14,15,16,17,18,19,20,21,27,29,30,32,35,36,37,39,40,43,45,46,55,57,59,60,63,65,69,73,77,78,80,84,95,96,98];
test('TEM-005: 41 natural bilingual candidates remain unverified',()=>{assert.equal(rows.length,41);for(const i of rows){const e=task.entries[i];assert.equal(e.verification,'needs-review');assert.equal(e.external_human_review,false);assert.equal(e.full_dictionary_senses_reviewed,false);assert.deepEqual(e.evidence,[]);assert.equal(e.draft_method,'editorial-context-rewrite-needs-review');assert.ok(e.proposed.example.trim());assert.ok(e.proposed.example_translation.trim());}});
