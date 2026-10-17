'use strict';
// Read-only deterministic continuation queue from actual result.json prefixes.
// No model output generation, no approval, no seed import and no DB access.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { ownerOf } = require('./audit-model-evidence');
const root = path.resolve(__dirname, '..');
const tasksRoot = path.join(root, 'docs/model-tasks-20261015');
const resultRoot = path.join(root, 'docs/model-task-results');

function plan(rootDir = root, { save = true } = {}) {
  const inputRoot = path.join(rootDir, 'docs/model-tasks-20261015');
  const outputRoot = path.join(rootDir, 'docs/model-task-results');
  const files = JSON.parse(fs.readFileSync(path.join(inputRoot, 'manifest.json'), 'utf8')).files;
  const plan = {
    operation: 'continue-worker-proposals-and-prioritize-review-not-approval',
    generated_at: new Date().toISOString(),
    workers: {}, all: { result_rows: 0, rows_not_yet_drafted: 0, needs_review: 0, source_claims_to_independently_verify: 0 },
    acceptance: { accepted: 0, installed: 0, authoritative_sources_verified_by_this_script: 0 },
  };
  for (const w of ['A', 'B', 'C']) plan.workers[w] = {
    draft_next: [], claims_to_recheck: [], incomplete_example_pairs: [],
    high_risk_issues: [], drafted_rows: 0, undrafted_rows: 0, needs_review_rows: 0,
  };
  for (const item of files) {
    const workerId = ownerOf(item.task_id);
    if (!workerId) continue;
    const worker = plan.workers[workerId];
    const inputPath = path.join(inputRoot, item.file);
    const inputBytes = fs.readFileSync(inputPath);
    if (createHash('sha256').update(inputBytes).digest('hex') !== item.sha256)
      throw Error('Task input SHA256 mismatch: ' + item.task_id);
    const input = JSON.parse(inputBytes.toString('utf8'));
    if (input.task_id !== item.task_id || !Array.isArray(input.entries)
      || input.entries.length !== item.rows) throw Error('Invalid task input: ' + item.task_id);
    const outputPath = path.join(outputRoot, 'worker-' + workerId, item.task_id, 'result.json');
    const result = fs.existsSync(outputPath)
      ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : null;
    if (result && (result.task_id !== item.task_id || result.input_sha256 !== item.sha256
      || result.status !== 'proposal')) throw Error('Task result metadata mismatch: ' + item.task_id);
    const entries = result ? result.entries : [];
    if (!Array.isArray(entries) || entries.length > item.rows)
      throw Error('Invalid task prefix length: ' + item.task_id);
    for (let i = 0; i < entries.length; i++) {
      const source = input.entries[i];
      const identity = source?.identity || Object.fromEntries(
        ['source_entry', 'headword', 'pdf_page', 'handling', 'accepted_spellings']
          .map(k => [k, source?.[k]]));
      if (!isDeepStrictEqual(entries[i]?.identity, identity)
        || !isDeepStrictEqual(entries[i]?.original, source?.current ?? null))
        throw Error('Task prefix identity/original mismatch: ' + item.task_id + ':' + i);
    }
    if (entries.length < item.rows) worker.draft_next.push({
      task_id: item.task_id,
      next_index: entries.length,
      next_word: input.entries[entries.length]?.identity?.word ?? input.entries[entries.length]?.headword ?? null,
      remaining_rows: item.rows - entries.length,
      preserve_existing_prefix_rows: entries.length,
      input_sha256: item.sha256,
    });
    worker.drafted_rows += entries.length;worker.undrafted_rows += item.rows - entries.length;
    plan.all.result_rows += entries.length; plan.all.rows_not_yet_drafted += item.rows - entries.length;
    for(let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const id = { task_id: item.task_id, row_index: i, word: e.identity?.word ?? e.identity?.headword ?? null };
      if(e.verification === 'needs-review') {
        worker.needs_review_rows++; plan.all.needs_review++;
      }
      if(e.verification === 'source-checked') {
        plan.all.source_claims_to_independently_verify++;
        // Worker claims aren't primary source verification, even if URL looks valid.
        if(worker.claims_to_recheck.length < 20) worker.claims_to_recheck.push(id);
      }
      if(!String(e.proposed?.example || '').trim()
        || !String(e.proposed?.example_translation || '').trim()) {
        worker.incomplete_example_pairs.push(id);
      }
      if(worker.high_risk_issues.length < 80 && Array.isArray(e.issues)
        && e.issues.some(v => {
          const s = typeof v === 'string' ? v : v?.code + ' ' + v?.message;
          return /homograph|phonetic-candidate|meaning-candidate|source-typo|sense-scope|词性|音标|释义错误|同形词/i.test(s || '');
        })) worker.high_risk_issues.push(id);
    }
  }
  if(save) {
    const p = path.join(rootDir, 'output/refinement/model-review-next-queue.json');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(plan, null, 2) + '\n');
  }
  return plan;
}
if(require.main === module) {
  const result = plan();
  console.log(JSON.stringify({
    note: 'This is a continuation/review queue, not a certificate of dictionary validation.',
    all: result.all,
    workers: Object.fromEntries(Object.entries(result.workers).map(([w, v]) => [w, {
      drafted_rows: v.drafted_rows, undrafted_rows: v.undrafted_rows,
      needs_review_rows: v.needs_review_rows, next_three: v.draft_next.slice(0, 3),
      missing_example_pairs: v.incomplete_example_pairs.length,
      high_risk_sample: v.high_risk_issues.slice(0, 5),
    }])),
  }, null, 2));
}
module.exports = { plan };
