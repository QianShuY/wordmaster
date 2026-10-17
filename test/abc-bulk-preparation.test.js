'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { exportBulk } = require('../scripts/prepare-abc-bulk');
const root = path.resolve(__dirname, '..');

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wordmaster-abc-bulk-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const ins = path.join(dir, 'docs/model-tasks-20261015/cet4');
  const outs = path.join(dir, 'docs/model-task-results/worker-A/cet4-001');
  fs.mkdirSync(ins, { recursive: true });
  fs.mkdirSync(outs, { recursive: true });
  const entries = [
    { identity: { source_file: 'cet4.txt', source_line: 10, word: 'light' },
      current: { pos: 'n.', meaning: '光', phonetic: 'laɪt', example: '', example_translation: '' } },
    { identity: { source_file: 'cet4.txt', source_line: 11, word: 'run' },
      current: { pos: 'v.', meaning: '跑', phonetic: 'rʌn', example: '', example_translation: '' } },
    { identity: { source_file: 'cet4.txt', source_line: 12, word: 'kind' },
      current: { pos: 'n.', meaning: '种类', phonetic: 'kaɪnd', example: '', example_translation: '' } },
  ];
  const source = { task_id: 'cet4-001', entries };
  const bytes = Buffer.from(JSON.stringify(source));
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(ins, 'cet4-001.json'), bytes);
  fs.writeFileSync(path.join(dir, 'docs/model-tasks-20261015/manifest.json'),
    JSON.stringify({ files: [{ task_id: 'cet4-001', file: 'cet4/cet4-001.json', rows: 3, sha256: sha }] }));
  const result = { task_id: 'cet4-001', input_sha256: sha, status: 'proposal',
    entries: [{
      identity: entries[0].identity, original: entries[0].current,
      verification: 'source-checked', selected_sense: { pos: 'n.', meaning: 'light' },
      proposed: { example: 'The light was on.', example_translation: '灯亮着。' },
      evidence: [{ url: 'https://dictionary.cambridge.org/dictionary/english/light',
        accessed: true, checked_pos: 'noun', checked_sense: 'light' }],
      issues: [],
    }] };
  const resultFile = path.join(outs, 'result.json');
  fs.writeFileSync(resultFile, JSON.stringify(result));
  return { dir, resultFile, entries };
}

test('bulk exports all draft and review items in one call without editing worker results', t => {
  const f = fixture(t);
  const before = fs.readFileSync(f.resultFile);
  const outDir = path.join(f.dir, 'output/refinement/abc-bulk');
  const { summary, packets } = exportBulk(f.dir, { outputDir: outDir, shardRows: 1 });
  assert.equal(summary.rows_assigned, 3);
  assert.equal(summary.existing_proposals, 1);
  assert.equal(summary.rows_needing_draft, 2);
  assert.equal(summary.rows_needing_independent_review, 1);
  assert.equal(summary.claimed_source_checked_not_independently_accepted, 1);
  assert.equal(summary.accepted, 0);
  assert.equal(summary.installed, 0);
  assert.equal(summary.api_keys_required, 0);
  assert.equal(summary.packets, 3);
  assert.equal(packets.filter(p => p.stage === 'draft').length, 2);
  assert.equal(packets.filter(p => p.stage === 'review').length, 1);
  const review = packets.find(p => p.stage === 'review').records[0];
  assert.ok(review.risk_flags.includes('worker-source-claim-not-independent-proof'));
  assert.equal(review.identity.word, 'light');
  assert.deepEqual(fs.readFileSync(f.resultFile), before);
  assert.ok(fs.existsSync(path.join(outDir, 'summary.json')));
});

test('bulk refuses altered historical results before exporting any packets', t => {
  const f = fixture(t);
  const result = JSON.parse(fs.readFileSync(f.resultFile));
  result.entries[0].identity.word = 'tampered';
  fs.writeFileSync(f.resultFile, JSON.stringify(result));
  const outputDir = path.join(f.dir, 'output/abc');
  assert.throws(() => exportBulk(f.dir, { outputDir }), /identity\/original mismatch/);
  assert.equal(fs.existsSync(outputDir), false);
});

test('bulk can plan the entire repository with no API key or database access', () => {
  const { summary, packets } = exportBulk(root, { save: false, shardRows: 500 });
  assert.equal(summary.rows_assigned, 26612);
  assert.equal(summary.rows_needing_draft + summary.existing_proposals, 26612);
  assert.ok(summary.rows_needing_draft > 0);
  assert.ok(summary.existing_proposals >= 14739);
  assert.equal(summary.workers.C.pending_draft, 0);
  assert.equal(summary.accepted, 0);
  assert.equal(summary.installed, 0);
  assert.equal(summary.packets, packets.length);
  assert.ok(packets.every(p => p.rows > 0 && p.rows <= 500));
});
