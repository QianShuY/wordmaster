'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-choices-test-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'choices.db');
const { app, db } = require('../app/main');

test('small custom vocabulary offers four unique definitions with one correct choice', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const addBook = name => Number(db.prepare("INSERT INTO wordbooks (name, description) VALUES (?, '')")
    .run(name).lastInsertRowid);
  const addWord = (bookId, word, meaning) => db.prepare(
    'INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)',
  ).run(bookId, word, meaning);
  const small = addBook('小词库');
  addWord(small, 'apple', '苹果');
  addWord(small, 'appletree', ' 苹果 ');
  addWord(small, 'banana', '香蕉');
  const other = addBook('大词库');
  for (const [word, meaning] of [
    ['pear', '梨'], ['peach', '桃子'], ['grape', '葡萄'], ['mango', '芒果'],
  ]) addWord(other, word, meaning);

  const response = await fetch(`${base}/api/books/${small}/study?mode=meaning`);
  assert.equal(response.status, 200);
  const words = await response.json();
  assert.equal(words.length, 3);
  for (const word of words) {
    assert.equal(word.choices.length, 4, 'fill from the larger vocabulary when needed');
    assert.equal(new Set(word.choices.map(c => c.trim().toLowerCase())).size, 4,
      'never offer the same definition twice even with whitespace variants');
    assert.equal(word.choices.filter(choice => choice === word.meaning).length, 1,
      'the correct original meaning occurs exactly once');
  }

  const biggerResponse = await fetch(`${base}/api/books/${other}/study?mode=meaning`);
  const biggerWords = await biggerResponse.json();
  for (const word of biggerWords) {
    assert.equal(word.choices.length, 4);
    assert.ok(word.choices.every(choice => ['梨', '桃子', '葡萄', '芒果'].includes(choice)),
      'prefer within-book answers if four distinct meanings exist');
  }
});
