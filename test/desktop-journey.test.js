'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Journey = require('../app/desktop-journey');

test('XP thresholds, continuous streaks, achievement milestones and calendar gaps', () => {
  assert.deepEqual(Journey.calculateLevel(0), { xp: 0, level: 1, current: 0, required: 100, nextLevelAt: 100 });
  assert.equal(Journey.calculateLevel(99).level, 1);
  assert.equal(Journey.calculateLevel(100).level, 2);
  assert.equal(Journey.calculateLevel(299).level, 2);
  assert.equal(Journey.calculateLevel(300).level, 3);
  assert.equal(Journey.calculateLevel(-5).level, 1);

  const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-06', '2026-10-07', '2026-10-08'];
  assert.deepEqual(Journey.streaks(days, new Date(2026, 9, 9, 12)), { current: 3, longest: 3 });
  assert.deepEqual(Journey.streaks(days, new Date(2026, 9, 11, 12)), { current: 0, longest: 3 });
  assert.deepEqual(Journey.streaks([], new Date(2026, 9, 9, 12)), { current: 0, longest: 0 });
  assert.ok(Number.isNaN(Journey.dayOrdinal('2026-02-30')));

  const j = Journey.buildJourney({
    totals: { xp: 318, attempts: 55 }, activeDays: days,
    mastered: 11, ownedCards: 0, today: new Date(2026, 9, 9, 12),
    daily: [{ day: '2026-10-08', total: 7 }, { day: '2026-10-09', total: 10 }],
  });
  assert.equal(j.level.level, 3);
  assert.equal(j.level.current, 18);
  assert.equal(j.answeredToday, 10);
  assert.equal(j.last7.length, 7);
  assert.equal(j.last7.at(-1).day, '2026-10-09');
  assert.equal(j.last7.at(-1).count, 10);
  assert.equal(j.stamps.find(s => s.id === 'streak3').unlocked, true);
  assert.equal(j.stamps.find(s => s.id === 'answers50').unlocked, true);
  assert.equal(j.stamps.find(s => s.id === 'cards5').unlocked, false);
});

const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-journey-api-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'app.db');
const { app, db } = require('../app/main');

test('desktop journey only reflects saved deduplicated answers and never changes spaced-repetition state', async t => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const bookId = Number(db.prepare("INSERT INTO wordbooks (name, description) VALUES ('成长系统测试', '')").run().lastInsertRowid);
  const wordId = Number(db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)')
    .run(bookId, 'habit', '习惯').lastInsertRowid);
  async function answer(payload) {
    const res = await fetch(`${base}/api/progress`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(res.status, 200);
    return res.json();
  }
  const first = { word_id: wordId, correct: true, is_new: true, request_id: 'journey-first-0001',
    session_id: 'journey-session-0001', outcome: 'first_correct' };
  await answer(first);
  const again = await answer(first);
  assert.equal(again.duplicate, true);
  await answer({ ...first, correct: false, is_new: false, outcome: 'wrong', request_id: 'journey-wrong-0002' });
  await answer({ ...first, correct: true, is_new: false, outcome: 'retry_correct', request_id: 'journey-retry-0003' });

  const before = db.prepare('SELECT correct, wrong, streak, next_due FROM progress WHERE word_id = ?').get(wordId);
  const response = await fetch(`${base}/api/desktop/journey`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const journey = await response.json();
  assert.equal(journey.level.xp, 18, 'first correct = 12, retry correct = 6, wrong = 0');
  assert.equal(journey.attempts, 3, 'repeated request IDs must not create XP');
  assert.equal(journey.answeredToday, 3);
  assert.equal(journey.dailyTarget, 10);
  assert.equal(journey.stamps.find(s => s.id === 'first').unlocked, true);
  assert.equal(journey.last7.length, 7);
  assert.deepEqual(db.prepare('SELECT correct, wrong, streak, next_due FROM progress WHERE word_id = ?').get(wordId), before);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, 3);
});
