'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const audit = require('../scripts/audit-model-evidence');

test('model task owners are disjoint across A/B/C assignments', () => {
  assert.equal(audit.ownerOf('cet4-017'), 'A');
  assert.equal(audit.ownerOf('cet6-023'), 'A');
  assert.equal(audit.ownerOf('tem-022'), 'A');
  assert.equal(audit.ownerOf('npee-038'), 'B');
  assert.equal(audit.ownerOf('gaokao-021'), 'B');
  assert.equal(audit.ownerOf('tem-023'), 'B');
  assert.equal(audit.ownerOf('tem-036'), 'B');
  assert.equal(audit.ownerOf('tem-037'), 'C');
  assert.equal(audit.ownerOf('tem-125'), 'C');
  assert.equal(audit.ownerOf('unknown-001'), null);
});

test('source claim requires sane HTTPS original-dictionary URL (not proof of independent verification)', () => {
  assert.equal(audit.recognizedDict('https://dictionary.cambridge.org/dictionary/english/moisture'), true);
  assert.equal(audit.recognizedDict('https://www.oxfordlearnersdictionaries.com/definition/english/solemn'), true);
  for (const url of ['http://dictionary.cambridge.org/dictionary/english/a',
    'https://dictionary.cambridge.org.evil.example/english/a',
    'javascript:alert(1)', '', null]) {
    assert.equal(audit.recognizedDict(url), false);
  }
});

test('full read-only handoff audit preserves task identities and never approves worker suggestions', () => {
  const root = path.resolve(__dirname, '..');
  const progressPath = path.join(root, 'docs/model-task-results/worker-B/progress.json');
  const before = fs.readFileSync(progressPath);
  const report = audit.inspect(root, { save: false });
  assert.equal(report.totals.assigned_tasks, 268);
  assert.equal(report.totals.assigned_rows, 26612);
  assert.ok(report.totals.actual_proposal_rows >= 14259);
  assert.equal(report.totals.primary_accepted_rows, 0);
  assert.equal(report.totals.installed_rows, 0);
  assert.equal(report.totals.result_files,
    report.totals.full_length_files + report.totals.partial_files);
  assert.equal(report.totals.claimed_source_checked_rows + report.totals.needs_review_rows,
    report.totals.actual_proposal_rows, 'unrecognized verification labels must not silently count as review');
  assert.ok(report.totals.evidence_missing_or_no_access > 7000,
    'thousands of source-free proposals must remain visible');
  assert.ok(report.workers.B.files.some(x => x.task_id === 'npee-038' && x.actual_rows >= 43),
    'continue the prior 40-row file rather than starting from zero');
  assert.ok(report.workers.A.files.some(x => x.task_id === 'cet4-017' && x.actual_rows >= 82));
  assert.equal(report.findings.filter(x => /^(identity-reordered|original-field-altered|manifest-input-sha-mismatch|result-identity-or-input-sha-mismatch)$/.test(x.code)).length, 0,
    'identity, ordering, originals and SHA linkage are non-negotiable');
  assert.deepEqual(fs.readFileSync(progressPath), before, 'audit must be read-only');
});
