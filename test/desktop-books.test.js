'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-desktop-books-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'study.db');
const { app, db } = require('../app/main');

test('desktop library search and filters paginate large books without breaking old API', async t => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const bookId = Number(db.prepare("INSERT INTO wordbooks(name, description) VALUES ('桌面长词库', '')").run().lastInsertRowid);
  const insert = db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)');
  let mastered, mistaken, due, fresh;
  for (let i = 0; i < 125; i++) {
    const word = `item${String(i).padStart(3, '0')}`;
    const meaning = i === 4 ? '百分之百 100%' : `释义${i}`;
    const id = Number(insert.run(bookId, word, meaning).lastInsertRowid);
    if (i === 1) mastered = id;
    if (i === 2) mistaken = id;
    if (i === 3) due = id;
    if (i === 4) fresh = id;
  }
  const progress = db.prepare('INSERT INTO progress (word_id, correct, wrong, streak, next_due) VALUES (?, ?, ?, ?, ?)');
  progress.run(mastered, 3, 0, 3, '2099-01-01 00:00:00');
  progress.run(mistaken, 0, 4, 0, '2099-01-01 00:00:00');
  progress.run(due, 1, 0, 1, '2001-01-01 00:00:00');
  const get = async (id, params = '') => {
    const response = await fetch(`${base}/api/desktop/books/${id}/words${params}`);
    return { status: response.status, body: await response.json() };
  };

  const first = await get(bookId);
  assert.equal(first.status, 200);
  assert.equal(first.body.total, 125);
  assert.equal(first.body.page, 1);
  assert.equal(first.body.pages, 4);
  assert.equal(first.body.items.length, 40);
  assert.equal(first.body.items[0].word, 'item000');
  assert.equal(first.body.items.at(-1).word, 'item039');

  const second = await get(bookId, '?page=2');
  assert.equal(second.body.items.length, 40);
  assert.equal(second.body.items[0].word, 'item040');
  const final = await get(bookId, '?page=999');
  assert.equal(final.body.page, 4);
  assert.equal(final.body.items.length, 5);
  assert.equal(final.body.items[0].word, 'item120');

  const find = await get(bookId, '?search=item002');
  assert.equal(find.body.total, 1);
  assert.equal(find.body.items[0].id, mistaken);
  const meaning = await get(bookId, '?search=' + encodeURIComponent('100%'));
  assert.equal(meaning.body.total, 1);
  assert.equal(meaning.body.items[0].id, fresh);
  const underscore = await get(bookId, '?search=_');
  assert.equal(underscore.body.total, 0, 'underscores are literal, not LIKE wildcards');

  for (const [status, id] of [
    ['mastered', mastered], ['mistakes', mistaken], ['due', due],
  ]) {
    const result = await get(bookId, '?status=' + status);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.items.map(x => x.id), [id]);
  }
  const newWords = await get(bookId, '?status=new&page_size=100');
  assert.equal(newWords.body.total, 122);
  assert.equal(newWords.body.items.length, 100);

  for (const args of ['?page=0','?page=-2','?page_size=101','?status=invalid']) {
    assert.equal((await get(bookId, args)).status, 400, args);
  }
  assert.equal((await get(99999)).status, 404);
  assert.equal((await get(bookId, '?search=' + 'x'.repeat(81))).status, 400);

  const legacy = await fetch(`${base}/api/books/${bookId}/words`);
  assert.equal(legacy.status, 200);
  assert.equal((await legacy.json()).length, 125, 'Android still has the legacy full-list endpoint');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM words WHERE book_id = ?').get(bookId).count, 125,
    'search and pagination never mutate user word data');
});
