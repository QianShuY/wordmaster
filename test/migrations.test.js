'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

test('legacy database upgrades without changing saved rows or IDs', (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-legacy-'));
  const dbPath = path.join(dir, 'legacy.db');
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE wordbooks (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT '', is_builtin INTEGER DEFAULT 0, created_at TEXT);
    CREATE TABLE words (id INTEGER PRIMARY KEY AUTOINCREMENT, book_id INTEGER NOT NULL REFERENCES wordbooks(id) ON DELETE CASCADE, word TEXT NOT NULL, phonetic TEXT DEFAULT '', pos TEXT DEFAULT '', meaning TEXT NOT NULL, example TEXT DEFAULT '', created_at TEXT, UNIQUE(book_id, word));
    CREATE TABLE progress (word_id INTEGER PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE, correct INTEGER DEFAULT 0, wrong INTEGER DEFAULT 0, streak INTEGER DEFAULT 0, last_review TEXT, next_due TEXT);
    CREATE TABLE review_log (id INTEGER PRIMARY KEY AUTOINCREMENT, word_id INTEGER NOT NULL, correct INTEGER NOT NULL, is_new INTEGER DEFAULT 0, ts TEXT DEFAULT (datetime('now', 'localtime')));
    CREATE TABLE cards (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL, rarity TEXT NOT NULL DEFAULT 'N', flavor TEXT DEFAULT '', palette TEXT DEFAULT 'ink', hidden INTEGER DEFAULT 0, unlock_at INTEGER DEFAULT 0);
    CREATE TABLE user_cards (card_id INTEGER NOT NULL REFERENCES cards(id), earned_at TEXT DEFAULT (datetime('now', 'localtime')), PRIMARY KEY (card_id));
    INSERT INTO wordbooks (id, name, description, is_builtin) VALUES (41, '自建词库', '保留说明', 0);
    INSERT INTO words (id, book_id, word, meaning) VALUES (77, 41, 'retain', '保留');
    INSERT INTO progress (word_id, correct, wrong, streak, last_review, next_due) VALUES (77, 4, 2, 1, '2026-09-20 10:00:00', '2026-09-21 10:00:00');
    INSERT INTO review_log (id, word_id, correct, is_new, ts) VALUES (91, 77, 1, 1, '2026-09-20 10:00:00');
    INSERT INTO cards (id, title, category, rarity, palette) VALUES (62, '固定卡牌', '测试', 'UR', 'stable');
    INSERT INTO user_cards (card_id, earned_at) VALUES (62, '2026-09-20 10:00:00');
  `);
  legacy.close();

  const migrate = `const { db, getSchemaVersion } = require('./app/db'); console.log(getSchemaVersion()); db.close();`;
  for (let i = 0; i < 2; i++) {
    execFileSync(process.execPath, ['-e', migrate], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, WORDMASTER_DB_PATH: dbPath },
      stdio: 'pipe',
    });
  }

  const upgraded = new DatabaseSync(dbPath, { readOnly: true });
  assert.equal(upgraded.prepare('SELECT schema_version FROM schema_meta WHERE id = 1').get().schema_version, 5);
  assert.equal(upgraded.prepare('SELECT id FROM wordbooks').get().id, 41);
  assert.equal(upgraded.prepare('SELECT id FROM words').get().id, 77);
  assert.deepEqual({ ...upgraded.prepare('SELECT correct, wrong, streak FROM progress WHERE word_id = 77').get() }, { correct: 4, wrong: 2, streak: 1 });
  assert.equal(upgraded.prepare('SELECT id FROM review_log').get().id, 91);
  const oldReview = upgraded.prepare('SELECT request_id, outcome, session_id, request_payload FROM review_log').get();
  assert.equal(oldReview.request_id, null);
  assert.equal(oldReview.session_id, null);
  assert.equal(oldReview.request_payload, null);
  assert.equal(upgraded.prepare('SELECT card_id FROM user_cards').get().card_id, 62);
  assert.equal(upgraded.prepare("SELECT name FROM pragma_table_info('progress') WHERE name = 'first_studied'").get().name, 'first_studied');
  assert.equal(upgraded.prepare('SELECT COUNT(*) AS n FROM card_draws').get().n, 0);
  assert.equal(upgraded.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  upgraded.close();
});
