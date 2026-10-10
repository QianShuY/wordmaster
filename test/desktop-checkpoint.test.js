'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Checkpoint = require('../shared/desktop-checkpoint');

const sampleWord = id => ({ id, word: 'word-' + id, meaning: '释义' + id, is_new: 0 });
function makeSnapshot(overrides = {}) {
  return {
    version: Checkpoint.VERSION, day: '2026-10-10', bookId: 42, instanceId: 'db-test-instance-1',
    stage: 'review', phaseDone: false,
    flow: { review: [sampleWord(1), sampleWord(2)], learn: [sampleWord(3)],
      reviewTotal: 2, learnTotal: 1,
      completed: { review: 0, learn: 0, spelling: 0 },
      reviewHasMore: false, learnHasMore: false },
    queue: [sampleWord(1), sampleWord(2)],
    roundWords: [sampleWord(1), sampleWord(2)],
    total: 2, done: 0, sessionId: 'daily-session-123456',
    counters: { correctCount: 0, firstCorrectCount: 0, retryCorrectCount: 0,
      wrongCount: 0, abandonedCount: 0, retryCount: 0 },
    attemptedWordIds: [], retryWordIds: [], learnAgainIds: [], learnCompletedIds: [],
    ...overrides,
  };
}
function makeStorage() {
  const data = new Map();
  return {
    data,
    getItem: key => data.get(key) || null,
    setItem: (key, val) => { data.set(key, val); },
    removeItem: key => { data.delete(key); },
  };
}

test('same-day checkpoints roundtrip, resume at next word, and expire at local midnight', () => {
  const storage = makeStorage();
  const initial = makeSnapshot();
  assert.equal(Checkpoint.write(storage, initial), true);
  const copy = Checkpoint.read(storage, 42, '2026-10-10', 'db-test-instance-1');
  assert.deepEqual(copy, initial);
  assert.equal(Checkpoint.read(storage, 43, '2026-10-10', 'db-test-instance-1'), null, 'book scopes are independent');
  assert.deepEqual(Checkpoint.progress(copy), {
    achieved: 0, expected: 3, stage: 'review', phaseDone: false,
    steps: { review: 0, learn: 0, spelling: 0 },
  });
  const afterFirst = makeSnapshot({
    queue: [sampleWord(2)], done: 1,
    counters: { ...initial.counters, firstCorrectCount: 1, correctCount: 1 },
  });
  assert.equal(Checkpoint.write(storage, afterFirst), true);
  assert.deepEqual(Checkpoint.read(storage, 42, '2026-10-10', 'db-test-instance-1').queue.map(w => w.id), [2],
    'already answered first word must not return to the queue');
  assert.equal(Checkpoint.progress(afterFirst).achieved, 1);
  assert.equal(Checkpoint.read(storage, 42, '2026-10-11', 'db-test-instance-1'), null);
  assert.equal(storage.data.size, 0, 'expired checkpoint must not be reinterpreted as new-day work');
});

test('phase boundaries preserve previous milestones and retry history', () => {
  const snap = makeSnapshot({
    stage: 'learn', phaseDone: false, queue: [sampleWord(3)], roundWords: [sampleWord(3)],
    total: 1, done: 0,
    flow: { ...makeSnapshot().flow,
      completed: { review: 2, learn: 0, spelling: 0 } },
    attemptedWordIds: ['1', '2'], retryWordIds: ['2'],
  });
  assert.equal(Checkpoint.sane(snap), true);
  assert.equal(Checkpoint.progress(snap).achieved, 2);
  const done = { ...snap, phaseDone: true, queue: [], done: 1,
    flow: { ...snap.flow, completed: { review: 2, learn: 1, spelling: 0 } } };
  assert.equal(Checkpoint.progress(done).achieved, 3);
  const storage = makeStorage();
  assert.equal(Checkpoint.write(storage, done), true);
  assert.equal(Checkpoint.read(storage, 42, '2026-10-10', 'db-test-instance-1').phaseDone, true,
    'a completed stage must reopen at its next-action screen');
});

test('new-word learning keeps all 10 words available for spelling after a five-word resume', () => {
  const allWords = Array.from({ length: 10 }, (_, i) => sampleWord(i + 101));
  const flow = { ...makeSnapshot().flow, learn: allWords, learnTotal: 10,
    completed: { review: 2, learn: 0, spelling: 0 } };
  const workingQueue = allWords.slice();
  const roundWords = workingQueue.slice();
  for (let i = 0; i < 5; i++) workingQueue.shift(); // five introductions already saved
  assert.equal(flow.learn.length, 10, 'the original manifest must never be shifted');
  assert.deepEqual(workingQueue.map(w => w.id), [106, 107, 108, 109, 110]);

  const snapshot = makeSnapshot({ stage: 'learn', flow, roundWords, queue: workingQueue,
    total: 10, done: 5 });
  const storage = makeStorage();
  assert.equal(Checkpoint.write(storage, snapshot), true);
  const restored = Checkpoint.read(storage, 42, '2026-10-10', 'db-test-instance-1');
  assert.equal(restored.flow.learn.length, 10, 'all ten remain eligible for spelling');
  assert.equal(restored.queue.length, 5, 'only the unfinished five remain for study');

  const legacy = makeSnapshot({ stage: 'learn',
    flow: { ...flow, learn: allWords.slice(0, 5) },
    roundWords, queue: workingQueue, total: 10, done: 5 });
  assert.equal(Checkpoint.write(storage, legacy), true);
  const repaired = Checkpoint.repairLearnManifest(
    Checkpoint.read(storage, 42, '2026-10-10', 'db-test-instance-1'));
  assert.deepEqual(repaired.flow.learn.map(w => w.id), allWords.map(w => w.id),
    'repair the shorter V1.4 manifest from the saved full round');
  assert.deepEqual(repaired.queue.map(w => w.id), workingQueue.map(w => w.id),
    'repair must not reintroduce previously answered words');
});

test('two databases sharing localhost cannot reuse the same unfinished word IDs', () => {
  const storage = makeStorage();
  assert.equal(Checkpoint.write(storage, makeSnapshot()), true);
  assert.equal(Checkpoint.read(storage, 42, '2026-10-10', 'db-different-installation'), null);
  assert.equal(storage.data.size, 0);
});

test('bad or corrupt checkpoints never interrupt studying', () => {
  const storage = makeStorage();
  assert.equal(Checkpoint.write(storage, makeSnapshot({ queue: [{ id: 9, word: null }] })), false);
  assert.equal(Checkpoint.write(storage, makeSnapshot({ stage: 'unknown' })), false);
  assert.equal(Checkpoint.write(storage, makeSnapshot({ done: 7 })), false);
  storage.setItem(Checkpoint.key(42), '{broken-json');
  assert.equal(Checkpoint.read(storage, 42, '2026-10-10', 'db-test-instance-1'), null);
  assert.equal(storage.data.size, 0);
  const blocked = { getItem() { throw Error('Storage denied'); },
    setItem() { throw Error('Storage denied'); }, removeItem() { throw Error('Storage denied'); } };
  assert.equal(Checkpoint.read(blocked, 42, '2026-10-10', 'db-test-instance-1'), null);
  assert.equal(Checkpoint.write(blocked, makeSnapshot()), false);
  assert.equal(Checkpoint.clear(blocked, 42), false);
});

test('UI connects saved progress, phase stepper and the daily route without touching Android', () => {
  const html = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '../static/app.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../static/desktop-redesign.css'), 'utf8');
  assert.match(html, /src="\/shared\/desktop-checkpoint\.js"/);
  for (const id of ['desktopStudyJourney', 'desktopStudySteps', 'desktopStudyOverallFill',
    'desktopDoneJourney', 'hubResumeNote', 'studyDoneTitle']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing ' + id);
  }
  assert.ok(app.includes('DesktopCheckpoint.read(localStorage, bookId, Domain.localDayKey(), this.instanceId)'));
  assert.ok(app.includes('this.queue = queue.slice()'), 'the quiz queue must never mutate the original word list');
  assert.ok(app.includes('DesktopCheckpoint.repairLearnManifest(snapshot)'));
  assert.match(app, /this\.saveTodayCheckpoint\(false, false\)/);
  assert.match(app, /this\.saveTodayCheckpoint\(false, true\)/);
  assert.match(css, /desktop-study-steps/);
  assert.match(css, /html\.is-android-app \.desktop-study-journey/);
});
