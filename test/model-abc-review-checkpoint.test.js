'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const result = (worker, task) => read('docs/model-task-results/worker-' + worker + '/' + task + '/result.json');

test('A/B prior partial results continue in original order and remain unapproved', () => {
  for (const [worker, task, offset] of [['A','cet4-017',82],['B','npee-038',43]]) {
    const file = result(worker, task);
    assert.equal(file.status, 'proposal');
    assert.equal(file.entries.length, 100);
    const manifest = read('docs/model-tasks-20261015/manifest.json');
    const item = manifest.files.find(x => x.task_id === task);
    const input = read('docs/model-tasks-20261015/' + item.file);
    for (let i = offset; i < 100; i++) {
      assert.deepEqual(file.entries[i].identity, input.entries[i].identity);
      assert.deepEqual(file.entries[i].original, input.entries[i].current);
      assert.equal(file.entries[i].verification, 'needs-review');
      assert.equal(file.entries[i].external_human_review, false);
      assert.equal(file.entries[i].full_dictionary_senses_reviewed, false);
      assert.ok(file.entries[i].proposed.example.trim());
      assert.ok(file.entries[i].proposed.example_translation.trim());
    }
    const progress = read('docs/model-task-results/worker-' + worker + '/progress.json');
    const status = progress.tasks.find(x => x.task_id === task);
    assert.equal(status.processed_rows, 100);
    assert.equal(status.status, 'submitted');
  }
});

test('C previously missing example pairs now exist with partial independent source evidence', () => {
  for (const [task, word] of [
    ['tem-049', 'image'], ['tem-086', 'ruffle'], ['tem-087', 'ruthless'],
  ]) {
    const row = result('C', task).entries.find(x => x.identity.word === word);
    assert.ok(row?.proposed.example?.trim());
    assert.ok(row?.proposed.example_translation?.trim());
    assert.equal(row.verification, 'needs-review');
    assert.equal(row.full_dictionary_senses_reviewed, false);
    assert.ok(row.evidence.some(x => x.independent_primary_page_review === true));
  }
});

test('C strike uses the noun sense in its proposal rather than the verb example', () => {
  const r = result('C', 'tem-099').entries.find(x => x.identity.word === 'strike');
  assert.equal(r.selected_sense.pos, 'n.');
  assert.match(r.proposed.example, /a strike/);
  assert.doesNotMatch(r.proposed.example, /to strike/);
  assert.equal(r.verification, 'needs-review');
});

test('B nine old evidence objects are retained as proper one-element arrays', () => {
  const r = result('B', 'npee-001');
  for (const word of ['academy','accelerate','acceptable','acceptance','accessory',
    'accidental','acclaim','accommodate','accomplish']) {
    const e = r.entries.find(x => x.identity.word === word);
    assert.equal(e.evidence.length, 1);
    assert.equal(typeof e.evidence[0].checked_sense, 'string');
    assert.equal(e.evidence[0].accessed, true);
  }
});

test('nine B lexical risk entries remain blocked from automated approval', () => {
  const blocked = [
    ['npee-018','initiative'], ['npee-022','madame'],
    ['npee-023','missionary'], ['npee-025','Negro'],
    ['npee-026','oriental'], ['npee-029','pitch'],
    ['npee-032','queer'], ['npee-032','rape'], ['npee-034','resume'],
  ];
  for (const [task,word] of blocked) {
    const x = result('B',task).entries.find(e=>e.identity.word===word);
    assert.ok(x, task + '/' + word + ' was accidentally removed');
    assert.equal(x.verification, 'needs-review');
    assert.notEqual(x.full_dictionary_senses_reviewed, true);
    assert.notEqual(x.external_human_review, true);
  }
});
