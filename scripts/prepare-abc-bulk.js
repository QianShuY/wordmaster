'use strict';
/**
 * Export ALL unfinished A/B/C work in a single run, without making up examples
 * or pretending any worker source claim is an independent dictionary review.
 * No network/API keys. No mutation of worker drafts, seed or student data.
 *
 * node scripts/prepare-abc-bulk.js
 * node scripts/prepare-abc-bulk.js --shard-rows=300
 */
const fs = require('node:fs');
const path = require('node:path');
const { plan } = require('./plan-next-model-review');
const { ownerOf } = require('./audit-model-evidence');
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIR = path.join(ROOT, 'output/refinement/abc-bulk');
const DEFAULT_ROWS = 500;
const hasText = v => typeof v === 'string' && v.trim().length > 0;

function exportBulk(root = ROOT, { outputDir = path.join(root, 'output/refinement/abc-bulk'),
  shardRows = DEFAULT_ROWS, save = true } = {}) {
  if (!Number.isInteger(shardRows) || shardRows < 1 || shardRows > 10000) {
    throw Error('shardRows must be an integer in [1,10000]');
  }
  // Fail closed if a worker mutated the original, reorder, hash, or result
  // status since the original handoff. This operation is intentionally read-only.
  const verified = plan(root, { save: false });
  const base = path.join(root, 'docs/model-tasks-20261015');
  const results = path.join(root, 'docs/model-task-results');
  const manifest = JSON.parse(fs.readFileSync(path.join(base, 'manifest.json'), 'utf8'));
  const packets = { A: { draft: [], review: [] }, B: { draft: [], review: [] },
    C: { draft: [], review: [] } };
  let undrafted = 0, toReview = 0;
  const queuedIds = new Set();
  const countByWorker = Object.fromEntries(['A', 'B', 'C'].map(w => [w, {
    pending_draft: 0, pending_review: 0, draft_packets: 0, review_packets: 0,
    evidence_claims_needing_independent_review: 0, possible_pos_conflicts: 0,
  }]));
  for (const file of manifest.files) {
    const worker = ownerOf(file.task_id);
    if (!worker || !packets[worker]) throw Error('Unassigned task: ' + file.task_id);
    if (queuedIds.has(file.task_id)) throw Error('Duplicate task: ' + file.task_id);
    queuedIds.add(file.task_id);
    const input = JSON.parse(fs.readFileSync(path.join(base, file.file), 'utf8'));
    const resultPath = path.join(results, 'worker-' + worker, file.task_id, 'result.json');
    const existing = fs.existsSync(resultPath)
      ? JSON.parse(fs.readFileSync(resultPath, 'utf8')).entries : [];
    const key = { worker, task_id: file.task_id, input_sha256: file.sha256 };
    for (let i = 0; i < input.entries.length; i++) {
      const original = input.entries[i];
      if (i >= existing.length) {
        packets[worker].draft.push({
          ...key, row_index: i, identity: original.identity ?? null,
          source_entry: original.source_entry ?? null,
          current: original.current ?? null,
          instruction: 'Propose an original bilingual example, preserve original, cite sources actually opened; never self-approve',
        });
        undrafted++; countByWorker[worker].pending_draft++;
        continue;
      }
      const draft = existing[i];
      const isClaim = draft.verification === 'source-checked';
      const selected = draft.selected_sense || {};
      const originalPos = String((draft.original || {}).pos || '').toLowerCase().trim();
      const selectedPos = String(selected.pos || '').toLowerCase().trim();
      const nounOnly = /^(n\.|noun)$/.test(originalPos);
      const adjectiveOnly = /^(a\.|adj\.|adjective)$/.test(originalPos);
      const selectedVerb = /^(v\.|vi\.|vt\.|verb\b)/.test(selectedPos);
      const likelyMismatch = (nounOnly
        && /^(to\s+\w+|verb\b)/i.test(String(selected.meaning || '')))
        || (nounOnly && selectedVerb) || (adjectiveOnly && selectedVerb);
      const missingExample = !hasText(draft.proposed?.example)
        || !hasText(draft.proposed?.example_translation);
      const issues = Array.isArray(draft.issues) ? draft.issues : [];
      const hasRisk = issues.some(issue => {
        const msg = typeof issue === 'string' ? issue
          : String(issue?.code || '') + ' ' + String(issue?.message || '');
        return /homograph|source-typo|sense-scope|same spelling|不同词性|词性|音标|冒犯|未核实|mismatch|unverified/i.test(msg);
      });
      if (isClaim) countByWorker[worker].evidence_claims_needing_independent_review++;
      if (likelyMismatch) countByWorker[worker].possible_pos_conflicts++;
      packets[worker].review.push({
        ...key, row_index: i, identity: draft.identity,
        original: draft.original, selected_sense: selected,
        proposed: draft.proposed, worker_verification: draft.verification,
        evidence: draft.evidence,
        risk_flags: [
          ...(missingExample ? ['missing-bilingual-example'] : []),
          ...(likelyMismatch ? ['possible-pos-mismatch'] : []),
          ...(hasRisk ? ['issue-language-review'] : []),
          ...(isClaim ? ['worker-source-claim-not-independent-proof'] : []),
        ],
        instruction: 'Open authoritative original source; verify all senses, UK IPA, POS, bilingual example and homographs; record explicit decision separately',
      });
      toReview++; countByWorker[worker].pending_review++;
    }
  }
  const allPackets = [];
  function chunk(worker, stage, records) {
    // Deterministic group with a max row count. Do not create empty packets.
    for (let pos = 0; pos < records.length; pos += shardRows) {
      const items = records.slice(pos, pos + shardRows);
      const id = worker + '-' + stage + '-' + String(Math.floor(pos / shardRows) + 1).padStart(3, '0');
      const record = { packet_id: id, worker, stage, rows: items.length,
        tasks: [...new Set(items.map(x => x.task_id))], records: items };
      allPackets.push(record);
      countByWorker[worker][stage + '_packets']++;
    }
  }
  for (const worker of ['A', 'B', 'C']) {
    // Sort review by risk, then task/input row, keeping the original identity
    // in each record for deterministic atomic application by a separate reviewer.
    packets[worker].review.sort((a, b) =>
      Number(b.risk_flags.length > 0) - Number(a.risk_flags.length > 0)
      || a.task_id.localeCompare(b.task_id) || a.row_index - b.row_index);
    chunk(worker, 'draft', packets[worker].draft);
    chunk(worker, 'review', packets[worker].review);
  }
  if (undrafted !== verified.all.rows_not_yet_drafted
    || toReview !== verified.all.result_rows
    || undrafted + toReview !== manifest.files.reduce((n, f) => n + f.rows, 0)) {
    throw Error('Bulk counts disagree with verified handoff: refuse export');
  }
  const summary = {
    operation: 'export-complete-ABC-draft-and-source-review-queues',
    generated_at: new Date().toISOString(),
    rows_assigned: undrafted + toReview, existing_proposals: toReview,
    rows_needing_draft: undrafted, rows_needing_independent_review: toReview,
    claimed_source_checked_not_independently_accepted: verified.all.source_claims_to_independently_verify,
    accepted: 0, installed: 0, requires_human_or_authoritative_dictionary_review: true,
    network_calls: 0, api_keys_required: 0,
    packets: allPackets.length, packet_files: allPackets.map(p => p.packet_id + '.json'), workers: countByWorker,
    note: 'Packet generation does not draft any examples, validate URLs, review dictionary meanings or modify installed vocabulary.',
  };
  if (save) {
    fs.mkdirSync(outputDir, { recursive: true });
    // Only generated files with this precise naming pattern can be cleaned up.
    // A rerun must never leave obsolete work packets next to the fresh summary.
    const currentNames = new Set(summary.packet_files);
    for (const filename of fs.readdirSync(outputDir)) {
      if (/^[ABC]-(draft|review)-\d{3,}\.json$/.test(filename)
        && !currentNames.has(filename)) fs.unlinkSync(path.join(outputDir, filename));
    }
    for (const pkt of allPackets) {
      fs.writeFileSync(path.join(outputDir, pkt.packet_id + '.json'),
        JSON.stringify(pkt, null, 2) + '\n');
    }
    fs.writeFileSync(path.join(outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2) + '\n');
  }
  return { summary, packets: allPackets };
}

if (require.main === module) {
  const value = process.argv.find(x => x.startsWith('--shard-rows='));
  const shardRows = value ? Number(value.split('=')[1]) : DEFAULT_ROWS;
  const { summary } = exportBulk(ROOT, { shardRows, outputDir: DEFAULT_DIR });
  console.log(JSON.stringify(summary, null, 2));
}
module.exports = { exportBulk };
