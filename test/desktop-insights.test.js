'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const Insights = require('../app/learning-insights');
const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-insights-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'study.db');
const { app, db } = require('../app/main');

test('learning diagnosis uses true seven-day samples and an explicit per-book scope', async t => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const bookA = Number(db.prepare(
    "INSERT INTO wordbooks(name, description) VALUES ('词库 A', '')"
  ).run().lastInsertRowid);
  const bookB = Number(db.prepare(
    "INSERT INTO wordbooks(name, description) VALUES ('词库 B', '')"
  ).run().lastInsertRowid);
  const add = db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)');
  const words = {
    aspire: Number(add.run(bookA, 'aspire', '渴望').lastInsertRowid),
    brisk: Number(add.run(bookA, 'brisk', '轻快的').lastInsertRowid),
    clarify: Number(add.run(bookA, 'clarify', '澄清').lastInsertRowid),
    diligent: Number(add.run(bookA, 'diligent', '勤奋的').lastInsertRowid),
    echo: Number(add.run(bookA, 'echo', '回声').lastInsertRowid),
    fromB: Number(add.run(bookB, 'frost', '霜').lastInsertRowid),
  };
  const upsert = db.prepare(
    'INSERT INTO progress (word_id, correct, wrong, streak, next_due) VALUES (?, ?, ?, ?, ?)'
  );
  upsert.run(words.aspire, 1, 2, 1, '2001-01-01 00:00:00');
  upsert.run(words.brisk, 0, 5, 0, '2099-01-01 00:00:00');
  upsert.run(words.clarify, 4, 0, 4, '2099-01-01 00:00:00');
  upsert.run(words.echo, 1, 0, 1, '2001-01-01 00:00:00');
  upsert.run(words.fromB, 1, 0, 1, '2001-01-01 00:00:00');

  const addLog = db.prepare(`INSERT INTO review_log (word_id, correct, is_new, ts)
    VALUES (?, ?, 0, datetime('now', 'localtime', ?))`);
  addLog.run(words.aspire, 1, '-1 day');
  addLog.run(words.brisk, 0, '-2 days');
  addLog.run(words.clarify, 1, '-8 days');
  addLog.run(words.fromB, 1, '-2 days');
  const before = {
    progress: db.prepare('SELECT COUNT(*) AS n FROM progress').get().n,
    logs: db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n,
  };
  const get = async uri => {
    const res = await fetch(base + uri);
    return { status: res.status, value: await res.json() };
  };
  const a = await get(`/api/desktop/insights?book_id=${bookA}`);
  assert.equal(a.status, 200);
  assert.equal(a.value.scope, 'book');
  assert.equal(a.value.book_name, '词库 A');
  assert.deepEqual(a.value.coverage, {
    total_words: 5, started_words: 4, unseen_words: 1,
    mastered_words: 1, started_percent: 80,
  });
  assert.deepEqual(a.value.review, { due_words: 2, mistake_words: 2 });
  assert.deepEqual(a.value.last7, { attempts: 2, correct: 1, percentage: 50 });
  assert.deepEqual(a.value.previous7, { attempts: 1, correct: 1, percentage: 100 });
  assert.equal(a.value.change_points, -50);
  assert.equal(a.value.recommendation.kind, 'due');
  assert.equal(a.value.recommendation.action, 'today');
  assert.deepEqual(a.value.focus_words.map(w => w.word), ['aspire','echo','brisk']);
  assert.equal(a.value.focus_words[0].reason, '到期且曾答错');
  assert.equal(a.value.focus_words[2].reason, '累计答错较多');

  const global = await get('/api/desktop/insights');
  assert.equal(global.status, 200);
  assert.equal(global.value.scope, 'all');
  assert.equal(global.value.book_id, null);
  assert.equal(global.value.review.due_words, 3);
  assert.deepEqual(global.value.last7, { attempts: 3, correct: 2, percentage: 67 });
  assert.equal(global.value.recommendation.action, 'choose_book');
  assert.ok(global.value.focus_words.some(w => w.book_id === bookB));

  const b = await get(`/api/desktop/insights?book_id=${bookB}`);
  assert.equal(b.status, 200);
  assert.equal(b.value.review.mistake_words, 0);
  assert.equal(b.value.coverage.started_percent, 100);
  assert.equal(b.value.previous7.percentage, null, 'no records means unknown, never 0%');
  assert.equal(b.value.change_points, null);

  const empty = Number(db.prepare(
    "INSERT INTO wordbooks(name, description) VALUES ('空词库', '')"
  ).run().lastInsertRowid);
  const nothing = await get(`/api/desktop/insights?book_id=${empty}`);
  assert.equal(nothing.status, 200);
  assert.equal(nothing.value.last7.percentage, null);
  assert.equal(nothing.value.coverage.started_percent, 0);
  assert.deepEqual(nothing.value.focus_words, []);
  assert.equal(nothing.value.recommendation.kind, 'empty');

  for (const uri of ['?book_id=abc', '?book_id=0', '?book_id=-1']) {
    assert.equal((await get('/api/desktop/insights' + uri)).status, 400);
  }
  assert.equal((await get('/api/desktop/insights?book_id=999999')).status, 404);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM progress').get().n, before.progress);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, before.logs);
});

test('insight decisions remain honest for missing samples and changing priorities', () => {
  const x = Insights.buildInsights({
    scope: 'book', bookId: 77, counts: { total_words: 2, started_words: 2,
      mastered_words: 2, due_words: 0, mistake_words: 0 },
  });
  assert.equal(x.last7.percentage, null);
  assert.equal(x.previous7.percentage, null);
  assert.equal(x.change_points, null);
  assert.equal(x.recommendation.kind, 'steady',
    'historically learned words with no recent answers are not a first-time learner');
  assert.match(x.recommendation.explanation, /历史学习记录/);
  const mistakes = Insights.buildInsights({
    scope: 'book', bookId: 77,
    counts: { total_words: 2, started_words: 2, due_words: 0, mistake_words: 1 },
    candidates: [{ id: 1, book_id: 77, word: 'word', meaning: '意思',
      wrong: 2, streak: 1, due_now: 0 }],
    recent: { attempts: 1, correct: 1 },
  });
  assert.equal(mistakes.recommendation.kind, 'mistakes');
  assert.equal(mistakes.recommendation.action, 'mistakes');
  assert.equal(mistakes.focus_words[0].reason, '曾经答错，尚需巩固');
  const fresh = Insights.buildInsights({
    scope: 'book', bookId: 77,
    counts: { total_words: 20, started_words: 0, due_words: 0, mistake_words: 0 },
  });
  assert.equal(fresh.recommendation.kind, 'new');
  assert.equal(fresh.recommendation.action, 'today');
});
