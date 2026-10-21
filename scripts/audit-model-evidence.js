'use strict';
/**
 * Reconcile proposals, not approvals. Never changes seeds, results, progress,
 * the SQLite database or user records. Checked URLs are model assertions
 * until an independent reviewer actually opens the source.
 *
 * node scripts/audit-model-evidence.js
 * node scripts/audit-model-evidence.js --strict
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');

const ROOT = path.resolve(__dirname, '..');
const INPUT_ROOT = path.join(ROOT, 'docs/model-tasks-20261015');
const OUTPUT_ROOT = path.join(ROOT, 'docs/model-task-results');
const REPORT_PATH = path.join(ROOT, 'output/refinement/model-evidence-audit.json');
const ownerOf = id => /^cet[46]-/.test(id) || /^tem-0(0[1-9]|1\d|2[0-2])$/.test(id)
  ? 'A' : /^npee-/.test(id) || /^gaokao-/.test(id)
  || /^tem-0(2[3-9]|3[0-6])$/.test(id) ? 'B'
    : /^tem-/.test(id) && Number(id.slice(4)) >= 37 ? 'C' : null;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const positiveInt = x => Number.isInteger(x) && x >= 0;
const recognizedDict = url => {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.username || u.password) return false;
    const h = u.hostname.toLowerCase();
    return h === 'dictionary.cambridge.org'
      || h === 'www.oxfordlearnersdictionaries.com'
      || h === 'www.collinsdictionary.com'
      || h === 'www.merriam-webster.com';
  } catch { return false; }
};
function problem(bucket, code, task_id, row, detail) {
  bucket.push({ code, task_id, ...(row === null ? {} : { row }), ...(detail ? { detail } : {}) });
}
function inspect(root = ROOT, { save = true } = {}) {
  const inroot = path.join(root, 'docs/model-tasks-20261015');
  const outroot = path.join(root, 'docs/model-task-results');
  const manifest = JSON.parse(fs.readFileSync(path.join(inroot, 'manifest.json'), 'utf8'));
  const totals = {
    assigned_tasks: manifest.files.length,
    assigned_rows: 0, result_files: 0, full_length_files: 0, partial_files: 0,
    actual_proposal_rows: 0, claimed_source_checked_rows: 0, needs_review_rows: 0,
    evidence_missing_or_no_access: 0, evidence_malformed: 0,
    source_claims_without_valid_dictionary_url: 0,
    draft_ipa_without_source_check: 0, example_pairs_missing: 0,
    issues_with_null_elements: 0,
    primary_accepted_rows: 0, installed_rows: null,
    shipped_selected_example_pairs: 0,
  };
  const findings = [], perWorker = {};
  const progressByWorker = {};
  for (const owner of ['A', 'B', 'C']) {
    perWorker[owner] = { assigned_tasks: 0, assigned_rows: 0,
      result_files: 0, full_length_files: 0, partial_files: 0, actual_proposal_rows: 0,
      claimed_source_checked_rows: 0, needs_review_rows: 0, evidence_missing_or_no_access: 0,
      draft_ipa_without_source_check: 0, progress_claimed_rows: 0, files: [] };
    const p = path.join(outroot, 'worker-' + owner, 'progress.json');
    const contents = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { tasks: [] };
    progressByWorker[owner] = new Map(contents.tasks.map(x => [x.task_id, x]));
    perWorker[owner].progress_claimed_rows = contents.tasks.reduce((a, x) => a + (Number(x.processed_rows) || 0), 0);
  }
  const manifestIds = new Set();
  for (const task of manifest.files) {
    const { task_id, file, rows, sha256 } = task;
    totals.assigned_rows += rows;
    const owner = ownerOf(task_id);
    if (!owner) { problem(findings, 'unknown-task-owner', task_id, null); continue; }
    if (manifestIds.has(task_id)) problem(findings, 'duplicate-task-id', task_id, null);
    manifestIds.add(task_id);
    const worker = perWorker[owner];
    worker.assigned_tasks++; worker.assigned_rows += rows;
    const inputPath = path.join(inroot, file);
    if (!fs.existsSync(inputPath)) { problem(findings, 'missing-task-input', task_id, null); continue; }
    const inputBytes = fs.readFileSync(inputPath);
    if (hash(inputBytes) !== sha256) { problem(findings, 'manifest-input-sha-mismatch', task_id, null); continue; }
    const input = JSON.parse(inputBytes.toString('utf8'));
    if (input.task_id !== task_id || !Array.isArray(input.entries) || input.entries.length !== rows) {
      problem(findings, 'input-shape-or-length', task_id, null); continue;
    }
    const progress = progressByWorker[owner].get(task_id);
    const resultPath = path.join(outroot, 'worker-' + owner, task_id, 'result.json');
    if (!fs.existsSync(resultPath)) {
      if (progress?.processed_rows > 0 || progress?.status === 'submitted')
        problem(findings, 'claimed-progress-without-result', task_id, null);
      continue;
    }
    let result;
    try { result = JSON.parse(fs.readFileSync(resultPath, 'utf8')); }
    catch (error) { problem(findings, 'unparseable-result-json', task_id, null, error.message); continue; }
    if (!Array.isArray(result.entries)) {
      problem(findings, 'missing-result-entries', task_id, null); continue;
    }
    totals.result_files++; worker.result_files++;
    const n = result.entries.length;
    if (n > rows) problem(findings, 'result-exceeds-input-rows', task_id, null, String(n));
    if (n === rows) { totals.full_length_files++; worker.full_length_files++; }
    else { totals.partial_files++; worker.partial_files++; }
    totals.actual_proposal_rows += n; worker.actual_proposal_rows += n;
    const item = { task_id, actual_rows: n, expected_rows: rows,
      progress_rows: progress?.processed_rows ?? null,
      claimed_source_checked: 0, needs_review: 0 };
    worker.files.push(item);
    if (result.task_id !== task_id || result.input_sha256 !== sha256)
      problem(findings, 'result-identity-or-input-sha-mismatch', task_id, null);
    if (result.status !== 'proposal') problem(findings, 'result-status-not-proposal', task_id, null);
    if (!progress || progress.processed_rows !== n
      || (progress.status === 'submitted' && n !== rows)
      || (progress.status === 'pending' && n > 0))
      problem(findings, 'progress-disagrees-with-result', task_id, null,
        `progress=${progress?.status || 'missing'}:${progress?.processed_rows ?? 'null'}, result=${n}/${rows}`);
    for (let i = 0; i < n; i++) {
      const row = result.entries[i], source = input.entries[i];
      const identity = source?.identity || Object.fromEntries(
        ['source_entry', 'headword', 'pdf_page', 'handling', 'accepted_spellings']
          .map(k => [k, source?.[k]]));
      if (!isDeepStrictEqual(identity, row?.identity))
        problem(findings, 'identity-reordered-or-altered', task_id, i);
      if (!isDeepStrictEqual(source?.current ?? null, row?.original))
        problem(findings, 'original-field-altered', task_id, i);
      if (row?.external_human_review === true || row?.approved === true
        || row?.full_dictionary_senses_reviewed === true)
        problem(findings, 'worker-claims-external-approval', task_id, i);
      const proposal = row?.proposed || {};
      if (!String(proposal.example || '').trim()
        || !String(proposal.example_translation || '').trim()) {
        totals.example_pairs_missing++;
        problem(findings, 'missing-bilingual-example', task_id, i);
      }
      if (Array.isArray(row?.issues) && row.issues.some(v => v == null))
        totals.issues_with_null_elements++;
      if (!Array.isArray(row?.issues))
        problem(findings, 'malformed-issues-field', task_id, i);
      const evidence = Array.isArray(row?.evidence) ? row.evidence : [];
      if (!Array.isArray(row?.evidence)) {
        totals.evidence_malformed++;
        problem(findings, 'malformed-evidence-field', task_id, i);
      }
      const usable = evidence.some(e => e?.accessed === true && recognizedDict(e.url)
        && String(e.checked_pos || '').trim() && String(e.checked_sense || '').trim());
      if (!usable) { totals.evidence_missing_or_no_access++; worker.evidence_missing_or_no_access++; }
      if (row?.verification === 'source-checked') {
        totals.claimed_source_checked_rows++;
        worker.claimed_source_checked_rows++;
        item.claimed_source_checked++;
        if (!usable) {
          totals.source_claims_without_valid_dictionary_url++;
          problem(findings, 'unsupported-source-checked-claim', task_id, i);
        }
      } else if (row?.verification === 'needs-review') {
        totals.needs_review_rows++;
        worker.needs_review_rows++;
        item.needs_review++;
        if (String(proposal.phonetic || '').trim()) {
          totals.draft_ipa_without_source_check++;
          worker.draft_ipa_without_source_check++;
        }
      } else problem(findings, 'unknown-verification-label', task_id, i);
    }
  }
  // Separately accepted examples do not certify the worker's full entry.
  // This source-only audit cannot infer installation in any user's database.
  const shipped=new Set();
  for(const name of ['examples-cet6-reviewed-20261021.json','examples-cet6-complete-reviewed-20261021.json']){
    const file=path.join(root,'app/seed',name);
    if(!fs.existsSync(file))continue;
    for(const e of JSON.parse(fs.readFileSync(file,'utf8')).examples||[]){
      if(e.review_status==='sense-reviewed'&&e.review_scope==='paired-example-only'&&e.candidate)
        shipped.add(e.candidate.task_id+':'+e.candidate.row_index);
    }
  }
  totals.shipped_selected_example_pairs=shipped.size;
  const report = {
    purpose: 'source-claim and structural audit, NEVER release approval',
    generated_at: new Date().toISOString(),
    scope: { branch: 'feat/moci-web-handoff-20261016', inputs: 'manifest.json' },
    totals, workers: perWorker,
    findings, blocking_findings: findings.filter(x =>
      !['malformed-issues-field'].includes(x.code)).length,
    note: 'Worker URLs are unverified claims, not independent dictionary verification. Separately reviewed example pairs may be shipped without approving the full worker entry. installed_rows is unknown because this audit never opens a learner database.',
  };
  if (save) {
    const dest = root === ROOT ? REPORT_PATH : path.join(root, 'output/refinement/model-evidence-audit.json');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(report, null, 2) + '\n');
  }
  return report;
}
if (require.main === module) {
  const report = inspect();
  console.log(JSON.stringify({
    output: REPORT_PATH,
    totals: report.totals,
    workers: Object.fromEntries(Object.entries(report.workers).map(([w, v]) =>
      [w, { assigned_tasks: v.assigned_tasks, full_files: v.full_length_files,
        partial_files: v.partial_files, proposal_rows: v.actual_proposal_rows,
        claimed_source_checked: v.claimed_source_checked_rows,
        needs_review: v.needs_review_rows, progress_rows: v.progress_claimed_rows }])),
    findings_count: report.findings.length,
    findings_sample: report.findings.slice(0, 20),
    full_worker_entries_approved: false,
    installation_checked: false,
  }, null, 2));
  if (process.argv.includes('--strict') && report.findings.length) process.exitCode = 1;
}
module.exports = { inspect, recognizedDict, ownerOf };
