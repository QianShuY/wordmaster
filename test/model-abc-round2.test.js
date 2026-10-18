'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('A/B follow their frozen input identities without installing 200 unverified examples', () => {
  const manifest = read('docs/model-tasks-20261015/manifest.json');
  for (const [worker, task] of [['A', 'cet4-018'], ['B', 'npee-039']]) {
    const info = manifest.files.find(f => f.task_id === task);
    assert.ok(info, 'task remains in the manifest');
    const input = read('docs/model-tasks-20261015/' + info.file);
    const result = read('docs/model-task-results/worker-' + worker + '/' + task + '/result.json');
    assert.equal(result.task_id, task);
    assert.equal(result.input_sha256, info.sha256);
    assert.equal(result.status, 'proposal');
    assert.equal(result.entries.length, 100);
    assert.equal(input.entries.length, 100);
    for (let i = 0; i < 100; i++) {
      const row = result.entries[i];
      assert.deepEqual(row.identity, input.entries[i].identity, 'identity retained at ' + task + ':' + i);
      assert.deepEqual(row.original, input.entries[i].current, 'original untouched at ' + task + ':' + i);
      assert.equal(row.verification, 'needs-review');
      assert.notEqual(row.external_human_review, true);
      assert.notEqual(row.full_dictionary_senses_reviewed, true);
      assert.equal(row.evidence.length, 0, 'draft cannot pretend an external dictionary was opened');
      assert.equal(row.proposed.phonetic, null, 'no fabricated UK IPA');
    }
    const progress = read('docs/model-task-results/worker-' + worker + '/progress.json');
    assert.equal(progress.tasks.find(t => t.task_id === task)?.processed_rows, 100);
  }
});

test('four partially source-checked B review entries are never counted as full acceptance', () => {
  const cases = [
    ['npee-018', 'initiative', 'merriam-webster.com/dictionary/initiative'],
    ['npee-023', 'missionary', 'merriam-webster.com/dictionary/missionary'],
    ['npee-029', 'pitch', 'merriam-webster.com/dictionary/pitch'],
    ['npee-034', 'resume', 'merriam-webster.com/dictionary/r%C3%A9sum%C3%A9'],
  ];
  for (const [task, word, expected] of cases) {
    const row = read('docs/model-task-results/worker-B/' + task + '/result.json')
      .entries.find(e => e.identity.word === word);
    assert.ok(row?.proposed?.example && row?.proposed?.example_translation);
    assert.equal(row.verification, 'needs-review');
    assert.equal(row.full_dictionary_senses_reviewed, false);
    assert.equal(row.external_human_review, false);
    assert.ok(row.evidence.some(e => e.accessed && e.independent_primary_page_review &&
      e.url.includes(expected) && e.checked_uk_ipa === null));
  }
});

test('six high-risk rows remain review-blocked even when safe usage notes fill the blanks', () => {
  const blocked = [
    ['A', 'cet4-018', 'Negro'],
    ['B', 'npee-022', 'madame'],
    ['B', 'npee-025', 'Negro'],
    ['B', 'npee-026', 'oriental'],
    ['B', 'npee-032', 'queer'],
    ['B', 'npee-032', 'rape'],
  ];
  for (const [worker, task, word] of blocked) {
    const row = read('docs/model-task-results/worker-' + worker + '/' + task + '/result.json')
      .entries.find(e => e.identity.word === word);
    assert.ok(row);
    assert.equal(row.verification, 'needs-review');
    const pair=Boolean(row.proposed?.example?.trim() && row.proposed?.example_translation?.trim());
    if(pair){
      assert.ok(row.proposed.example.toLowerCase().includes(word.toLowerCase()),
        task + ':' + word + ' must have an explicit, contextual caution');
      assert.ok(row.issues.some(issue=>typeof issue==='string'
        && /历史语境|审核|称谓/.test(issue)),
        task + ':' + word + ' must remain flagged for editorial review');
      assert.equal(row.full_dictionary_senses_reviewed,false);
      assert.notEqual(row.external_human_review,true);
    }else{
      assert.ok(!row.proposed?.example||!row.proposed?.example_translation,
        task + ':' + word + ' remains deliberately blocked prior to safe drafting');
    }
  }
});

test('second-round review work increases candidate count, not accepted count', () => {
  const { plan } = require('../scripts/plan-next-model-review');
  const p = plan(root, { save: false });
  assert.ok(p.all.result_rows >= 14539);
  assert.equal(p.all.result_rows + p.all.rows_not_yet_drafted, 26612);
  assert.equal(p.acceptance.accepted, 0);
  assert.equal(p.acceptance.installed, 0);
});
