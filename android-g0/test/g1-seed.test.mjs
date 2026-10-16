import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const androidRoot = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.resolve(androidRoot, '..');
const assetsRoot = path.join(androidRoot, 'android', 'app', 'src', 'main', 'assets');
const generatedRoot = path.join(androidRoot, 'seed', 'generated');
const require = createRequire(import.meta.url);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

test('G1 Android seed matches a fresh isolated Web seed and includes no learning records', (t) => {
  const manifest = JSON.parse(readFileSync(path.join(assetsRoot, 'seed-manifest.json'), 'utf8'));
  const bundle = JSON.parse(readFileSync(path.join(generatedRoot, 'wordmaster-seed.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(path.join(androidRoot, 'seed', 'word-key-lock.json'), 'utf8'));
  const cardLock = JSON.parse(readFileSync(path.join(androidRoot, 'seed', 'card-key-lock.json'), 'utf8'));
  const seedPath = path.join(assetsRoot, 'wordmaster-seed.db');
  const seedBytes = readFileSync(seedPath);
  assert.equal(sha256(seedBytes), manifest.database_sha256);
  const { bundle_sha256: bundleSha, ...canonicalBundle } = bundle;
  assert.equal(sha256(Buffer.from(JSON.stringify(canonicalBundle))), bundleSha);
  assert.equal(bundleSha, manifest.bundle_sha256);
  assert.equal(manifest.source_schema_version, 5);
  assert.deepEqual(manifest.counts, {
    wordbooks: 5, words: 20374, progress: 0, review_log: 0, cards: 62, user_cards: 0, card_draws: 0,
  });
  assert.equal(Object.keys(lock.books).length, 5);
  assert.equal(Object.keys(cardLock.books.cards).length, 62);

  const androidDb = new DatabaseSync(seedPath, { readOnly: true });
  assert.equal(androidDb.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.equal(androidDb.prepare('PRAGMA user_version').get().user_version, 1);
  assert.deepEqual({
    wordbooks: androidDb.prepare('SELECT COUNT(*) AS n FROM wordbooks').get().n,
    words: androidDb.prepare('SELECT COUNT(*) AS n FROM words').get().n,
    progress: androidDb.prepare('SELECT COUNT(*) AS n FROM progress').get().n,
    review_log: androidDb.prepare('SELECT COUNT(*) AS n FROM review_log').get().n,
    cards: androidDb.prepare('SELECT COUNT(*) AS n FROM cards').get().n,
    user_cards: androidDb.prepare('SELECT COUNT(*) AS n FROM user_cards').get().n,
    card_draws: androidDb.prepare('SELECT COUNT(*) AS n FROM card_draws').get().n,
  }, manifest.counts);
  assert.deepEqual(androidDb.prepare('SELECT id, card_key, palette FROM cards ORDER BY id').all().map(card => ({ ...card })),
    bundle.cards.map(({ id, card_key, palette }) => ({ id, card_key, palette })));
  for (const card of manifest.cards) {
    assert.ok(existsSync(path.join(projectRoot, 'static', card.asset_path)), `missing card image ${card.asset_path}`);
  }
  assert.equal(manifest.cards.length, 62);
  assert.equal(Object.keys(bundle.card_copy).length, 62);

  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-g1-web-seed-'));
  t.after(() => {
    androidDb.close();
    rmSync(tempRoot, { recursive: true, force: true });
  });
  const webPath = path.join(tempRoot, 'fresh-web.db');
  const previousDbPath = process.env.WORDMASTER_DB_PATH;
  process.env.WORDMASTER_DB_PATH = webPath;
  const { db: webDb, seed } = require(path.join(projectRoot, 'app', 'db.js'));
  try {
    const originalLog = console.log;
    console.log = () => {};
    try {
      webDb.exec('BEGIN IMMEDIATE');
      seed({ legacyAndroid: true });
      webDb.exec('COMMIT');
    } catch (error) {
      try { webDb.exec('ROLLBACK'); } catch {}
      throw error;
    } finally {
      console.log = originalLog;
    }

    const webBooks = webDb.prepare('SELECT id, name FROM wordbooks WHERE is_builtin = 1 ORDER BY id').all();
    assert.equal(webBooks.length, manifest.counts.wordbooks);
    const namesToKeys = new Map(manifest.books.map(book => [book.name, book.book_key]));
    for (const book of webBooks) {
      const bookKey = namesToKeys.get(book.name);
      assert.ok(bookKey, `unexpected built-in book ${book.name}`);
      const webWords = webDb.prepare('SELECT word, phonetic, pos, meaning, example FROM words WHERE book_id = ? ORDER BY id').all(book.id);
      const androidWords = androidDb.prepare('SELECT word, phonetic, pos, meaning, example FROM words WHERE book_key = ? ORDER BY seed_order').all(bookKey);
      assert.equal(androidWords.length, webWords.length, `${book.name} count differs`);
      assert.deepEqual(androidWords.map(row => ({ ...row })), webWords.map(row => ({ ...row })));
      const manifestBook = manifest.books.find(row => row.book_key === bookKey);
      assert.equal(manifestBook.word_count, webWords.length);
      assert.equal(androidDb.prepare('SELECT COUNT(*) AS n FROM words WHERE book_key = ? AND word_key NOT LIKE ?')
        .get(bookKey, `${bookKey}:entry:%`).n, 0);
      assert.ok(Object.keys(lock.books[bookKey]).length >= webWords.length);
    }

    const webCards = webDb.prepare('SELECT id, title, category, rarity, flavor, palette, hidden, unlock_at FROM cards ORDER BY id').all();
    const androidCards = androidDb.prepare('SELECT id, title, category, rarity, flavor, palette, hidden, unlock_at FROM cards ORDER BY id').all();
    assert.deepEqual(androidCards.map(row => ({ ...row })), webCards.map(row => ({ ...row })));
  } finally {
    webDb.close();
    if (previousDbPath === undefined) delete process.env.WORDMASTER_DB_PATH;
    else process.env.WORDMASTER_DB_PATH = previousDbPath;
  }
});

test('G1 seed copy can recover after interruption and v1 migration preserves saved rows', (t) => {
  const manifest = JSON.parse(readFileSync(path.join(assetsRoot, 'seed-manifest.json'), 'utf8'));
  const seedPath = path.join(assetsRoot, 'wordmaster-seed.db');
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-g1-atomic-seed-'));
  t.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const writablePath = path.join(tempRoot, 'wordmaster.db');
  const stagingPath = path.join(tempRoot, 'wordmaster.db.seed.tmp');

  const seedBytes = readFileSync(seedPath);
  writeFileSync(stagingPath, seedBytes.subarray(0, Math.floor(seedBytes.length / 3)));
  assert.notEqual(sha256(readFileSync(stagingPath)), manifest.database_sha256);
  assert.equal(existsSync(writablePath), false, 'an interrupted staging copy must not become the writable DB');
  rmSync(stagingPath);

  copyFileSync(seedPath, stagingPath);
  assert.equal(sha256(readFileSync(stagingPath)), manifest.database_sha256);
  const stagedDb = new DatabaseSync(stagingPath, { readOnly: true });
  assert.equal(stagedDb.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  stagedDb.close();
  renameSync(stagingPath, writablePath);
  assert.equal(existsSync(writablePath), true);

  const upgraded = new DatabaseSync(writablePath);
  const wordKey = 'builtin:zhongkao:entry:000001';
  upgraded.exec('BEGIN IMMEDIATE');
  upgraded.prepare(`INSERT INTO progress (word_key, correct, wrong, streak, last_review, next_due, first_studied)
    VALUES (?, 4, 2, 1, '2026-09-20 10:00:00', '2026-09-21 10:00:00', '2026-09-20 10:00:00')`).run(wordKey);
  upgraded.prepare(`INSERT INTO review_log
    (word_key, correct, is_new, ts, request_id, outcome, session_id, request_payload)
    VALUES (?, 1, 1, '2026-09-20 10:00:00', 'legacy-event-0001', 'first_correct', 'legacy-session-0001', '{}')`).run(wordKey);
  upgraded.exec(`ALTER TABLE review_log ADD COLUMN local_day TEXT NOT NULL DEFAULT '1970-01-01';
    ALTER TABLE review_log ADD COLUMN timezone_id TEXT NOT NULL DEFAULT 'legacy-unknown';
    UPDATE review_log SET local_day = substr(ts, 1, 10) WHERE local_day = '1970-01-01';
    CREATE INDEX IF NOT EXISTS idx_review_log_local_day ON review_log(local_day);
    PRAGMA user_version = 2;
    COMMIT;`);
  assert.equal(upgraded.prepare('PRAGMA user_version').get().user_version, 2);
  assert.deepEqual({ ...upgraded.prepare('SELECT correct, wrong, streak FROM progress WHERE word_key = ?').get(wordKey) },
    { correct: 4, wrong: 2, streak: 1 });
  assert.equal(upgraded.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, 1);
  assert.deepEqual({ ...upgraded.prepare('SELECT local_day, timezone_id FROM review_log').get() },
    { local_day: '2026-09-20', timezone_id: 'legacy-unknown' });
  assert.equal(upgraded.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  upgraded.close();
});
