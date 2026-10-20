'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rules } = require('../scripts/audit-abc-example-quality');
const root = path.join(__dirname, '../docs/model-task-results/worker-A/tem-007');
const task = JSON.parse(fs.readFileSync(path.join(root, 'result.json'), 'utf8'));
const packet = JSON.parse(fs.readFileSync(path.join(root, 'editorial-candidates-20261021.json'), 'utf8'));
test('TEM-007: staged 50 bilingual candidates are source-locked and unverified', () => {
  assert.equal(task.task_id, 'tem-007');
  assert.equal(packet.task_id, 'tem-007');
  assert.equal(packet.status, 'unmerged-review-candidates');
  assert.equal(packet.verification, 'needs-review');
  assert.equal(packet.entries.length, 50);
  assert.equal(new Set(packet.entries.map(x => x.index)).size, 50);
  for (const x of packet.entries) {
    const e = task.entries[x.index];
    assert.equal(e.identity.word, x.word);
    assert.equal(e.identity.source_line, x.source_line);
    assert.equal(e.identity.source_raw, x.source_raw);
    assert.deepEqual(e.selected_sense, x.selected_sense);
    assert.equal(e.identity.source_file, 'tem.txt');
    assert.equal(e.original.example, '');
    assert.equal(e.original.example_translation, '');
    assert.equal(e.verification, 'needs-review');
    assert.equal(e.external_human_review, false);
    assert.equal(e.full_dictionary_senses_reviewed, false);
    assert.deepEqual(e.evidence, []);
    assert.ok(x.english.endsWith('.'), x.word);
    assert.ok(x.chinese.endsWith('。'), x.word);
    assert.doesNotMatch(x.chinese, /[“”]/);
    const flagged = rules.filter(rule => rule.pattern.test(
      rule.id === 'translation-metalinguistic' ? x.chinese : x.english
    )).map(rule => rule.id);
    assert.deepEqual(flagged, [], 'candidate still templated: ' + x.word);
    if (e.proposed.example === x.expected_old) {
      assert.notEqual(e.proposed.example, x.english);
    } else {
      assert.equal(e.proposed.example, x.english, x.word);
      assert.equal(e.proposed.example_translation, x.chinese, x.word);
      assert.equal(e.draft_method, 'editorial-context-rewrite-needs-review', x.word);
    }
  }
});
