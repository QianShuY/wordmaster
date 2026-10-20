'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('../scripts/audit-abc-example-quality');

const task = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../docs/model-task-results/worker-A/cet6-014/result.json'), 'utf8'
));
const corrected = new Map([
  [17, 'prosecute'], [22, 'protest'], [27, 'provoke'], [29, 'prune'],
  [34, 'purchase'], [35, 'purify'], [43, 'quarterly'], [49, 'quiver'],
  [54, 'radiate'], [60, 'rape'], [69, 'reassure'], [80, 'recite'],
  [85, 'recognize'], [88, 'recover'],
]);

test('CET6-014: 14 mechanical examples become bilingual contextual proposals', () => {
  assert.equal(task.task_id, 'cet6-014');
  assert.equal(task.entries.length, 100);
  for (const [row, word] of corrected) {
    const entry = task.entries[row];
    assert.equal(entry.identity.word, word, `source identity at row ${row}`);
    assert.equal(entry.identity.source_file, 'cet6.txt');
    assert.equal(entry.original.example, '');
    assert.equal(entry.original.example_translation, '');
    assert.equal(entry.verification, 'needs-review');
    assert.equal(entry.external_human_review, false);
    assert.equal(entry.full_dictionary_senses_reviewed, false);
    assert.deepEqual(entry.evidence, []);
    assert.equal(entry.draft_method, 'editorial-context-rewrite-needs-review');
    assert.ok(entry.proposed.example.trim().endsWith('.'));
    assert.ok(entry.proposed.example_translation.trim().endsWith('。'));
    assert.ok(!/[“”]/.test(entry.proposed.example_translation), word);
    const flagged = rules.filter(rule => rule.pattern.test(
      rule.id === 'translation-metalinguistic'
        ? entry.proposed.example_translation
        : entry.proposed.example
    ));
    assert.deepEqual(flagged.map(rule => rule.id), [], `templated usage: ${word}`);
  }
});

test('CET6-014: assault example is a criminal allegation, not encouragement', () => {
  const en = task.entries[60].proposed.example;
  const cn = task.entries[60].proposed.example_translation;
  assert.match(en, /charged with raping/);
  assert.match(cn, /被控强奸/);
  assert.doesNotMatch(en, /encouraged to/i);
});

test('CET6-014: recover source POS conflict is kept visible for review', () => {
  const entry = task.entries[88];
  assert.equal(entry.original.pos, 'n.');
  assert.equal(entry.selected_sense.pos, 'n.');
  assert.match(entry.issues.join(' '), /源词表将 recover 标为 n\./);
});
