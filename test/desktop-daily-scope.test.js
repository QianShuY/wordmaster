'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temp = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-daily-scope-'));
process.env.WORDMASTER_DB_PATH = path.join(temp, 'review.db');
const { app, db } = require('../app/main');

test('daily desk uses 13 due plus 10 planned new words, while charts have an explicit book scope', async t => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(temp, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = Number(db.prepare(
    "INSERT INTO wordbooks(name, description, daily_new) VALUES ('六级练习', '', 10)"
  ).run().lastInsertRowid);
  const second = Number(db.prepare(
    "INSERT INTO wordbooks(name, description, daily_new) VALUES ('其他词库', '', 15)"
  ).run().lastInsertRowid);
  const add = db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)');
  const dueIds = [], freshIds = [], otherIds = [];
  for (let i = 0; i < 13; i++) dueIds.push(Number(add.run(first, `review-${i}`, `复习词义${i}`).lastInsertRowid));
  for (let i = 0; i < 10; i++) freshIds.push(Number(add.run(first, `fresh-${i}`, `新词词义${i}`).lastInsertRowid));
  for (let i = 0; i < 4; i++) otherIds.push(Number(add.run(second, `other-${i}`, `其他词义${i}`).lastInsertRowid));
  const upsert = db.prepare('INSERT INTO progress (word_id, correct, wrong, streak, next_due) VALUES (?, ?, ?, ?, ?)');
  for (const id of dueIds) upsert.run(id, 1, 0, 1, '2001-01-01 00:00:00');
  for (const id of otherIds) upsert.run(id, 1, 0, 1, '2001-01-01 00:00:00');
  db.prepare('INSERT INTO review_log (word_id, correct, is_new) VALUES (?, 1, 0)').run(dueIds[0]);
  db.prepare('INSERT INTO review_log (word_id, correct, is_new) VALUES (?, 0, 0)').run(dueIds[1]);
  db.prepare('INSERT INTO review_log (word_id, correct, is_new) VALUES (?, 1, 0)').run(otherIds[0]);

  const get = async endpoint => {
    const response = await fetch(base + endpoint);
    return { status: response.status, body: await response.json() };
  };
  const daily = await get(`/api/desktop/books/${first}/today`);
  const mistakeList=await get('/api/mistakes'),mistakeCount=await get('/api/desktop/mistakes/count');
  assert.equal(mistakeCount.status,200);
  assert.equal(mistakeCount.body.count,mistakeList.body.length);
  assert.deepEqual(Object.keys(mistakeCount.body),['count']);
  assert.equal(daily.status, 200);
  assert.equal(daily.body.review.length, 13, 'review all 13, never cap at 10');
  assert.equal(daily.body.learn.length, 10, 'also include all planned 10 new words');
  assert.equal(daily.body.due_total, 13);
  assert.equal(daily.body.new_remaining, 10);
  assert.equal(new Set([...daily.body.review, ...daily.body.learn].map(w => w.id)).size, 23,
    'review and new phases must not duplicate any word');
  assert.ok(daily.body.review.every(w => w.is_new === 0));
  assert.ok(daily.body.learn.every(w => w.is_new === 1));

  const scoped = await get(`/api/stats/overview?book_id=${first}`);
  assert.equal(scoped.status, 200);
  assert.equal(scoped.body.today.due_review, 13);
  assert.equal(scoped.body.today.new_today, 0);
  assert.equal(scoped.body.today.daily_new_quota, 10);
  assert.equal(scoped.body.total.today_reviewed, 2);

  const global = await get('/api/stats/overview?scope=all');
  assert.equal(global.status, 200);
  assert.equal(global.body.today.due_review, 17);
  assert.equal(global.body.today.daily_new_quota, null,
    'do not sum unrelated quotas into a misleading 0/255 target');
  assert.equal(global.body.total.today_reviewed, 3);

  const scopedDaily = await get(`/api/stats/daily?days=90&book_id=${first}`);
  assert.equal(scopedDaily.status, 200);
  assert.equal(scopedDaily.body.at(-1).total, 2);
  const globalDaily = await get('/api/stats/daily?days=90');
  assert.equal(globalDaily.body.at(-1).total, 3);
  const legacyOverview = await get('/api/stats/overview');
  assert.equal(legacyOverview.status, 200);
  assert.equal(legacyOverview.body.today.daily_new_quota, 25,
    'legacy Android summary remains unchanged');

  for (const url of ['/api/desktop/books/0/today', '/api/stats/overview?book_id=invalid',
    '/api/stats/daily?book_id=0']) {
    assert.equal((await get(url)).status, 400, url);
  }
  assert.equal((await get('/api/desktop/books/999999/today')).status, 404);

  const learned = await fetch(base + '/api/learn', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word_id: freshIds[0] }),
  });
  assert.equal(learned.status, 200);
  const after = await get(`/api/desktop/books/${first}/today`);
  assert.equal(after.body.learn.length, 9, 'marking a new word learned removes it from the new-word phase');
  assert.equal((await get(`/api/stats/overview?book_id=${first}`)).body.today.new_today, 1);

  for (const id of freshIds.slice(1)) {
    const response = await fetch(base + '/api/learn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: id }),
    });
    assert.equal(response.status, 200);
  }
  const completed = await get(`/api/stats/overview?book_id=${first}`);
  assert.equal(completed.body.today.new_today, 10);
  assert.equal(completed.body.today.daily_new_quota, 10,
    'finishing the last new word today must show 10/10 instead of 10/0');
  assert.equal((await get(`/api/desktop/books/${first}/today`)).body.learn.length, 0);
});
