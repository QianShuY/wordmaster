'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dir = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-api-'));
process.env.WORDMASTER_DB_PATH = path.join(dir, 'api.db');
const { app, db } = require('../app/main');

const bookId = Number(db.prepare("INSERT INTO wordbooks (name, description) VALUES ('测试词库', '')").run().lastInsertRowid);
const wordId = Number(db.prepare("INSERT INTO words (book_id, word, meaning) VALUES (?, 'reliable', '可靠的')").run(bookId).lastInsertRowid);
const otherWordId = Number(db.prepare("INSERT INTO words (book_id, word, meaning) VALUES (?, 'consistent', '稳定的')").run(bookId).lastInsertRowid);
const sampleBookId = Number(db.prepare("INSERT INTO wordbooks (name, description, is_builtin) VALUES ('六级核心词汇', '', 1)").run().lastInsertRowid);
const sampleWordId = Number(db.prepare("INSERT INTO words (book_id, word, phonetic, pos, meaning) VALUES (?, 'cardinal 2', 'ˈkɑːdɪnəl', 'n.', '红衣主教')").run(sampleBookId).lastInsertRowid);
const customBookId = Number(db.prepare("INSERT INTO wordbooks (name, description, is_builtin) VALUES ('自建词库', '', 0)").run().lastInsertRowid);
db.prepare("INSERT INTO words (book_id, word, phonetic, pos, meaning) VALUES (?, 'cardinal 2', 'ˈkɑːdɪnəl', 'n.', '红衣主教')").run(customBookId);
db.prepare("INSERT INTO cards (title, category, rarity, palette) VALUES ('测试卡', '测试', 'N', 'test-card')").run();
const hiddenCardId = Number(db.prepare("INSERT INTO cards (title, category, rarity, palette, hidden, unlock_at) VALUES ('仰望星空', '天文', 'UR', 'hawking', 1, 10)").run().lastInsertRowid);

const server = app.listen(0);
const serverReady = once(server, 'listening');

test('progress saves atomically, classifies retries, and deduplicates request IDs', async (t) => {
  t.after(async () => {
    server.close();
    await once(server, 'close');
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await serverReady;
  const base = `http://127.0.0.1:${server.address().port}`;
  const sampleWordsResponse = await fetch(`${base}/api/books/${sampleBookId}/words`);
  const sampleWords = await sampleWordsResponse.json();
  const sampleWord = sampleWords.find(word => word.id === sampleWordId);
  assert.equal(sampleWordsResponse.status, 200);
  assert.equal(sampleWord.word, 'cardinal 2', 'source headword remains unchanged in the API');
  assert.equal(sampleWord.id, sampleWordId, 'presentation keeps the original word identity');
  assert.equal(sampleWord.display_word, 'cardinal');
  assert.equal(sampleWord.answer_word, 'cardinal');
  assert.equal(sampleWord.sense_label, '同形词 II');
  assert.equal(db.prepare('SELECT word FROM words WHERE id = ?').get(sampleWordId).word, 'cardinal 2');
  const sampleStudyWords = await (await fetch(`${base}/api/books/${sampleBookId}/study?mode=learn`)).json();
  assert.equal(sampleStudyWords.find(word => word.id === sampleWordId)?.answer_word, 'cardinal');
  const customWords = await (await fetch(`${base}/api/books/${customBookId}/words`)).json();
  assert.equal(customWords[0].word, 'cardinal 2');
  assert.equal(customWords[0].display_word, undefined, 'custom vocab keeps its original numbered headword');

  const lockedCopyResponse = await fetch(`${base}/api/cards/copy`);
  const lockedCopy = await lockedCopyResponse.json();
  assert.equal(lockedCopyResponse.status, 200);
  assert.equal(Object.keys(lockedCopy).length, 59);
  assert.equal(lockedCopy.hawking, undefined, 'hidden copy stays private before the card is owned');
  const postProgress = async (payload) => {
    const response = await fetch(`${base}/api/progress`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() };
  };

  const first = { word_id: wordId, correct: false, is_new: true, request_id: 'attempt-wrong-0001', session_id: 'session-round-0001', outcome: 'wrong' };
  const firstResponse = await postProgress(first);
  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.body.outcome, 'wrong');
  const duplicate = await postProgress(first);
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, 1);
  assert.deepEqual({ ...db.prepare('SELECT correct, wrong, streak FROM progress WHERE word_id = ?').get(wordId) }, { correct: 0, wrong: 1, streak: 0 });

  const changedWord = await postProgress({ ...first, word_id: otherWordId });
  assert.equal(changedWord.status, 409);
  const changedAnswer = await postProgress({ ...first, correct: true, outcome: 'first_correct' });
  assert.equal(changedAnswer.status, 409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, 1);

  const retried = await postProgress({ word_id: wordId, correct: true, is_new: true, request_id: 'attempt-right-0002', session_id: 'session-round-0001', outcome: 'retry_correct' });
  assert.equal(retried.body.outcome, 'retry_correct');
  assert.deepEqual(
    db.prepare('SELECT outcome FROM review_log WHERE word_id = ? AND session_id = ? ORDER BY id').all(wordId, 'session-round-0001').map(row => row.outcome),
    ['wrong', 'retry_correct'],
  );
  assert.deepEqual(
    { ...db.prepare('SELECT correct, wrong FROM progress WHERE word_id = ?').get(wordId) },
    { correct: 1, wrong: 1 },
  );
  assert.equal(db.prepare('SELECT SUM(is_new) AS n FROM review_log').get().n, 1);

  const wrongInOldRound = await postProgress({
    word_id: otherWordId, correct: false, is_new: true,
    request_id: 'attempt-old-round-wrong-0004', session_id: 'session-old-round-0001', outcome: 'wrong',
  });
  assert.equal(wrongInOldRound.body.outcome, 'wrong');
  const firstInNewRound = await postProgress({
    word_id: otherWordId, correct: true, is_new: true,
    request_id: 'attempt-new-round-right-0005', session_id: 'session-new-round-0001', outcome: 'first_correct',
  });
  assert.equal(firstInNewRound.body.outcome, 'first_correct');

  db.exec(`CREATE TRIGGER fail_review_insert BEFORE INSERT ON review_log
    WHEN NEW.request_id = 'attempt-retry-save-0003'
    BEGIN SELECT RAISE(ABORT, 'forced test failure'); END`);
  const failedPayload = { word_id: wordId, correct: true, is_new: false, request_id: 'attempt-retry-save-0003', session_id: 'session-round-0001', outcome: 'first_correct' };
  const originalConsoleError = console.error;
  let failed;
  try {
    console.error = () => {};
    failed = await postProgress(failedPayload);
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(failed.status, 500);
  assert.deepEqual({ ...db.prepare('SELECT correct, wrong, streak FROM progress WHERE word_id = ?').get(wordId) }, { correct: 1, wrong: 1, streak: 1 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, 4);

  db.exec('DROP TRIGGER fail_review_insert');
  const savedAfterRetry = await postProgress(failedPayload);
  assert.equal(savedAfterRetry.status, 200);
  assert.equal(db.prepare('SELECT correct FROM progress WHERE word_id = ?').get(wordId).correct, 2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n, 5);

  const missingId = await postProgress({ word_id: wordId, correct: true, outcome: 'first_correct' });
  assert.equal(missingId.status, 400);
  const missingSession = await postProgress({ word_id: wordId, correct: true, request_id: 'attempt-no-session-0006', outcome: 'first_correct' });
  assert.equal(missingSession.status, 400);

  const learnedId = Number(db.prepare("INSERT INTO words (book_id, word, meaning) VALUES (?, 'persist', '坚持')").run(bookId).lastInsertRowid);
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${base}/api/learn`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word_id: learnedId }),
    });
    assert.equal(response.status, 200);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM progress WHERE word_id = ?').get(learnedId).n, 1);

  const reviewsBeforeCard = db.prepare('SELECT COUNT(*) AS n FROM review_log').get().n;
  for (let i = 0; i < Math.max(0, 10 - reviewsBeforeCard); i++) {
    const response = await postProgress({
      word_id: wordId, correct: true, is_new: false,
      request_id: `attempt-card-${String(i).padStart(4, '0')}`, session_id: 'session-card-run-0001', outcome: 'first_correct',
    });
    assert.equal(response.status, 200);
  }
  const cardState = await (await fetch(`${base}/api/cards`)).json();
  assert.equal(cardState.today_answered, 10);
  const draw = await fetch(`${base}/api/cards/draw`, { method: 'POST' });
  assert.equal(draw.status, 200);
  const repeatedDraw = await fetch(`${base}/api/cards/draw`, { method: 'POST' });
  assert.equal(repeatedDraw.status, 409);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM user_cards').get().n, 1);

  db.prepare('INSERT INTO user_cards (card_id) VALUES (?)').run(hiddenCardId);
  const unlockedCopyResponse = await fetch(`${base}/api/cards/copy`);
  const unlockedCopy = await unlockedCopyResponse.json();
  assert.equal(unlockedCopyResponse.status, 200);
  assert.equal(Object.keys(unlockedCopy).length, 60);
  assert.equal(unlockedCopy.hawking.englishEncouragement, 'When you face the unknown, you need not fill every blank at once.');
});
