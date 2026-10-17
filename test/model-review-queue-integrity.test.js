'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { plan } = require('../scripts/plan-next-model-review');

// Tiny isolated fixtures: never touch the actual learning database or worker drafts.
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wordmaster-review-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const inputDir = path.join(root, 'docs/model-tasks-20261015/cet4');
  const resultDir = path.join(root, 'docs/model-task-results/worker-A/cet4-001');
  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(resultDir, { recursive: true });
  const identity = { source_file: 'cet4.txt', source_line: 1, word: 'apple', headword: 'apple' };
  const current = { pos: 'n.', meaning: '苹果', phonetic: 'ˈæpl', example: '', example_translation: '' };
  const input = { task_id: 'cet4-001', entries: [{ identity, current }] };
  const inputPath = path.join(inputDir, 'cet4-001.json');
  const bytes = Buffer.from(JSON.stringify(input));
  fs.writeFileSync(inputPath, bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const manifestPath = path.join(root, 'docs/model-tasks-20261015/manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    files: [{ task_id: 'cet4-001', file: 'cet4/cet4-001.json', rows: 1, sha256 }],
  }));
  const resultPath = path.join(resultDir, 'result.json');
  const result = {
    task_id: 'cet4-001', input_sha256: sha256, status: 'proposal',
    entries: [{ identity, original: current, verification: 'needs-review',
      proposed: { example: 'I ate an apple.', example_translation: '我吃了一个苹果。' },
      evidence: [], issues: [] }],
  };
  fs.writeFileSync(resultPath, JSON.stringify(result));
  return { root, inputPath, manifestPath, resultPath, result };
}

test('continuation accepts an intact prefix without rewriting it or approving proposals', t => {
  const f = fixture(t);
  const before = fs.readFileSync(f.resultPath);
  const queue = plan(f.root, { save: false });
  assert.equal(queue.all.result_rows, 1);
  assert.equal(queue.all.rows_not_yet_drafted, 0);
  assert.equal(queue.all.needs_review, 1);
  assert.equal(queue.acceptance.accepted, 0);
  assert.deepEqual(fs.readFileSync(f.resultPath), before);
});

for (const scenario of [
  {
    name: 'reordered or altered row identity',
    mutate: f => { f.result.entries[0].identity = { ...f.result.entries[0].identity, word: 'pear' }; },
    expected: /prefix identity\/original mismatch/,
  },
  {
    name: 'altered original fields',
    mutate: f => { f.result.entries[0].original.meaning = '梨'; },
    expected: /prefix identity\/original mismatch/,
  },
  {
    name: 'wrong result input SHA',
    mutate: f => { f.result.input_sha256 = '0'.repeat(64); },
    expected: /result metadata mismatch/,
  },
  {
    name: 'result claiming approval rather than proposal',
    mutate: f => { f.result.status = 'accepted'; },
    expected: /result metadata mismatch/,
  },
]) {
  test('continuation refuses ' + scenario.name, t => {
    const f = fixture(t);
    scenario.mutate(f);
    fs.writeFileSync(f.resultPath, JSON.stringify(f.result));
    assert.throws(() => plan(f.root, { save: false }), scenario.expected);
  });
}

test('continuation refuses modified task input despite a matching result file', t => {
  const f = fixture(t);
  fs.appendFileSync(f.inputPath, ' ');
  assert.throws(() => plan(f.root, { save: false }), /input SHA256 mismatch/);
});
