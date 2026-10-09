'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-backup-test-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'original.db');
const { app, db } = require('../app/main');

test('desktop backup is a valid consistent SQLite snapshot, and invalid learn IDs are rejected', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;

  const bookId = Number(db.prepare("INSERT INTO wordbooks (name, description) VALUES (?, '')")
    .run('我的测试词库').lastInsertRowid);
  const wordId = Number(db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)')
    .run(bookId, 'backup', '备份').lastInsertRowid);
  const request = async word_id => {
    const res = await fetch(`${base}/api/learn`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id }),
    });
    return res.status;
  };

  assert.equal(await request(-1), 400);
  assert.equal(await request('not-an-id'), 400);
  assert.equal(await request(999999), 404);
  assert.equal(await request(wordId), 200);
  assert.equal(await request(wordId), 200, 'repeat learn action stays idempotent');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM progress WHERE word_id = ?').get(wordId).n, 1);

  const response = await fetch(`${base}/api/backup`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/octet-stream/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-disposition'), /WordMaster-backup-\d{4}-\d{2}-\d{2}\.db/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length > 100, 'database file is not empty');
  const backupPath = path.join(dir, 'downloaded.db');
  writeFileSync(backupPath, bytes);

  const snapshot = new DatabaseSync(backupPath);
  try {
    assert.equal(snapshot.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.equal(snapshot.prepare('SELECT word FROM words WHERE id = ?').get(wordId).word, 'backup');
    assert.equal(snapshot.prepare('SELECT COUNT(*) AS n FROM progress WHERE word_id = ?').get(wordId).n, 1);
    db.prepare('INSERT INTO words (book_id, word, meaning) VALUES (?, ?, ?)')
      .run(bookId, 'new-after-backup', '随后新增');
    assert.equal(snapshot.prepare('SELECT COUNT(*) AS n FROM words WHERE word = ?').get('new-after-backup').n, 0,
      'download is a point-in-time copy, not the live database');
  } finally {
    snapshot.close();
  }
});
