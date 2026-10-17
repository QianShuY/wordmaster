'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { plan } = require('../scripts/plan-next-model-review');

test('worker continuation plan uses actual result prefixes and never rewrites outputs', () => {
  const root = path.resolve(__dirname, '..');
  const bPath = path.join(root, 'docs/model-task-results/worker-B/npee-038/result.json');
  const original = fs.readFileSync(bPath);
  const p = plan(root, { save: false });
  assert.equal(p.all.result_rows + p.all.rows_not_yet_drafted, 26612);
  assert.ok(p.all.result_rows >= 14264, 'retain existing worker proposals');
  assert.equal(p.workers.C.undrafted_rows, 0,
    'worker C has drafted its entire assignment, even though most lacks dictionary sources');
  assert.ok(p.workers.C.needs_review_rows > 7000, 'do not count C drafts as accepted');
  const a = p.workers.A.draft_next.find(x => x.task_id === 'cet4-017');
  const b = p.workers.B.draft_next.find(x => x.task_id === 'npee-038');
  if (a) assert.ok(a.next_index >= 82, 'the first 82 proposal rows must be kept');
  if (b) assert.ok(b.next_index >= 43, 'the first 43 proposal rows must be kept');
  assert.deepEqual(fs.readFileSync(bPath), original, 'queue generation must not change worker results');
  assert.equal(p.acceptance.accepted, 0);
  assert.equal(p.acceptance.installed, 0);
});
