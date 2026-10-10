'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync, readFileSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-mistake-scope-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'study.db');
const { app, db } = require('../app/main');

test('scoped mistake drill never mixes wordbooks and preserves the old Android all-books API', async t => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const createBook = db.prepare('INSERT INTO wordbooks (name, description) VALUES (?, ?)');
  const a = Number(createBook.run('六级词库', '').lastInsertRowid);
  const b = Number(createBook.run('四级词库', '').lastInsertRowid);
  const createWord = db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)');
  const ids = [
    Number(createWord.run(a, 'aspire', '渴望').lastInsertRowid),
    Number(createWord.run(a, 'brisk', '轻快的').lastInsertRowid),
    Number(createWord.run(b, 'clarify', '澄清').lastInsertRowid),
    Number(createWord.run(b, 'diligent', '勤奋的').lastInsertRowid),
  ];
  const progress = db.prepare('INSERT INTO progress (word_id, correct, wrong, streak, next_due) VALUES (?, ?, ?, ?, ?)');
  progress.run(ids[0], 1, 2, 0, '2099-01-01');
  progress.run(ids[1], 1, 1, 0, '2099-01-01');
  progress.run(ids[2], 1, 5, 1, '2099-01-01');
  progress.run(ids[3], 3, 0, 3, '2099-01-01');
  const get = async url => {
    const response = await fetch(base + url);
    return { status: response.status, body: await response.json() };
  };
  const legacy = await get('/api/mistakes');
  assert.equal(legacy.status, 200);
  assert.deepEqual(new Set(legacy.body.map(w => w.id)), new Set(ids.slice(0, 3)));

  const viewA = await get(`/api/mistakes?book_id=${a}`);
  assert.equal(viewA.status, 200);
  assert.deepEqual(viewA.body.map(w => w.id).sort(), ids.slice(0, 2).sort());
  assert.ok(viewA.body.every(w => w.book_id === a));
  const viewB = await get(`/api/mistakes?book_id=${b}`);
  assert.deepEqual(viewB.body.map(w => w.id), [ids[2]]);
  const drillA = await get(`/api/mistakes/study?mode=spelling&book_id=${a}`);
  assert.equal(drillA.status, 200);
  assert.equal(drillA.body.length, 2);
  assert.ok(drillA.body.every(w => w.book_id === a));
  const drillB = await get(`/api/mistakes/study?mode=meaning&book_id=${b}`);
  assert.equal(drillB.body.length, 1);
  assert.equal(drillB.body[0].id, ids[2]);
  assert.ok(Array.isArray(drillB.body[0].choices), 'choice study remains supported');
  assert.equal((await get('/api/mistakes/study?mode=spelling')).body.length, 3,
    'unscoped Android drill must remain global');

  for (const suffix of ['?book_id=0', '?book_id=oops', '?book_id=-4']) {
    assert.equal((await get('/api/mistakes' + suffix)).status, 400, suffix);
    assert.equal((await get('/api/mistakes/study?mode=spelling&' + suffix.slice(1))).status, 400);
  }
  assert.equal((await get('/api/mistakes?book_id=999999')).status, 404);
  assert.equal((await get('/api/mistakes/study?mode=spelling&book_id=999999')).status, 404);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM progress').get().n, 4,
    'list and drill preparation must not modify progress rows');
});

test('desktop focus-word routing retains source book and study scope end to end', () => {
  const js = readFileSync(path.join(__dirname, '../static/app.js'), 'utf8');
  const html = readFileSync(path.join(__dirname, '../static/index.html'), 'utf8');
  for (const id of ['desktopMistakesBook', 'desktopMistakesHint', 'difficultWords']) {
    assert.ok(html.includes('id="' + id + '"'), `Missing #${id}`);
  }
  assert.ok(js.includes('data-insight-word='));
  assert.ok(js.includes('data-insight-book='));
  assert.ok(js.includes('data-insight-due='));
  assert.ok(js.includes('Mistakes.study(this.mode, Mistakes.studyScopeBookId)'),
    'replay of scoped drills must not switch back to all wordbooks');
  assert.ok(js.includes('word_id=${wordId}'),
    'non-due errors must be linkable to the highlighted word');
  assert.ok(js.includes('/api/mistakes/study?mode='),
    'mistake drill must still use the real existing study endpoint');
});
