'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..', '..', '..');
const db = new DatabaseSync(path.join(root, 'data', 'wordmaster.db'), { readOnly: true });
const cards = new Map(db.prepare('SELECT id,title,palette FROM cards').all().map(row => [row.palette, row]));
db.close();
const publicCopy = JSON.parse(fs.readFileSync(path.join(root, 'static', 'cards', 'card-copy.json'), 'utf8'));
const hiddenCopy = JSON.parse(fs.readFileSync(path.join(root, 'app', 'seed', 'card-copy.hidden.json'), 'utf8'));
const copy = { ...publicCopy, ...hiddenCopy };
const facts = Object.entries(copy).filter(([, entry]) => entry.type === 'fact');

async function check([palette, entry]) {
  const card = cards.get(palette);
  const output = {
    id: card?.id ?? null,
    palette,
    title: card?.title ?? null,
    claim: entry.knowledge,
    sourceLabel: entry.source?.label ?? '',
    sourceUrl: entry.source?.url ?? '',
  };
  if (!/^https:\/\//.test(output.sourceUrl)) return { ...output, status: 'NO_HTTPS_SOURCE' };
  try {
    const response = await fetch(output.sourceUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'WordMaster-source-audit/1.0', accept: 'text/html,application/pdf,*/*' },
    });
    const result = { ...output, status: response.status, finalUrl: response.url, contentType: response.headers.get('content-type') || '' };
    await response.body?.cancel();
    return result;
  } catch (error) {
    return { ...output, status: 'FETCH_ERROR', error: String(error.cause?.code || error.name || error.message) };
  }
}

async function run() {
  const results = [];
  for (let i = 0; i < facts.length; i += 4) {
    results.push(...await Promise.all(facts.slice(i, i + 4).map(check)));
  }
  const file = path.join(__dirname, 'fact-source-checks.json');
  fs.writeFileSync(file, JSON.stringify({ checkedAt: new Date().toISOString(), factsChecked: results.length, results }, null, 2), 'utf8');
  const summary = results.reduce((counts, item) => {
    const key = String(item.status);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ factsChecked: results.length, summary, file: path.relative(root, file) }));
}

run().catch(error => { console.error(error); process.exitCode = 1; });
