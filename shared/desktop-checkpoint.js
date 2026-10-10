'use strict';

// Browser storage is a resumable *view* of a desktop daily session. The SQLite
// DB remains the authority for saved answers, XP and due dates. Never copy
// passwords, API keys or tokens into a checkpoint.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WordMasterDesktopCheckpoint = api;
})(typeof window === 'undefined' ? null : window, function () {
  const VERSION = 2;
  const PREFIX = 'wordmaster_desktop_today_v14_';
  const STAGES = new Set(['review', 'learn', 'spelling']);

  const key = bookId => PREFIX + String(bookId);
  const natural = value => Number.isSafeInteger(value) && value >= 0 && value <= 10000;
  const word = value => value && Number.isSafeInteger(value.id) && value.id > 0
    && typeof value.word === 'string';
  const words = values => Array.isArray(values) && values.length <= 200
    && values.every(word);
  const sane = value => value && value.version === VERSION
    && Number.isSafeInteger(value.bookId) && value.bookId > 0
    && typeof value.instanceId === 'string' && value.instanceId.length >= 12
    && /^\d{4}-\d{2}-\d{2}$/.test(value.day)
    && STAGES.has(value.stage)
    && typeof value.phaseDone === 'boolean'
    && value.flow && words(value.flow.review) && words(value.flow.learn)
    && natural(value.flow.reviewTotal) && natural(value.flow.learnTotal)
    && typeof value.flow.reviewHasMore === 'boolean'
    && typeof value.flow.learnHasMore === 'boolean'
    && value.flow.completed && ['review', 'learn', 'spelling'].every(k => natural(value.flow.completed[k]))
    && words(value.roundWords) && words(value.queue)
    && natural(value.total) && natural(value.done) && value.done <= value.total
    && value.counters && ['correctCount','firstCorrectCount','retryCorrectCount',
      'wrongCount','abandonedCount','retryCount'].every(k => natural(value.counters[k]))
    && typeof value.sessionId === 'string' && value.sessionId.length >= 8
    && ['attemptedWordIds', 'retryWordIds', 'learnAgainIds', 'learnCompletedIds']
      .every(k => Array.isArray(value[k]) && value[k].length <= 500);

  function read(storage, bookId, day, instanceId) {
    if (!storage || !Number.isSafeInteger(bookId) || bookId < 1) return null;
    try {
      const raw = storage.getItem(key(bookId));
      if (!raw) return null;
      const snapshot = JSON.parse(raw);
      if (!sane(snapshot) || snapshot.bookId !== bookId || snapshot.day !== day
        || snapshot.instanceId !== instanceId) {
        storage.removeItem(key(bookId));
        return null;
      }
      return snapshot;
    } catch {
      try { storage.removeItem(key(bookId)); } catch {}
      return null;
    }
  }

  function write(storage, snapshot) {
    if (!sane(snapshot) || !storage) return false;
    try {
      storage.setItem(key(snapshot.bookId), JSON.stringify(snapshot));
      return true;
    } catch {
      return false; // quota/storage disabled: never interrupt actual studying
    }
  }

  function clear(storage, bookId) {
    try { storage?.removeItem(key(bookId)); return true; }
    catch { return false; }
  }

  function progress(snapshot) {
    if (!sane(snapshot)) return null;
    const { flow } = snapshot;
    const completed = { ...flow.completed };
    if (!snapshot.phaseDone) completed[snapshot.stage] = Math.min(snapshot.total, snapshot.done);
    const expected = Math.max(0, flow.reviewTotal + flow.learnTotal);
    const achieved = Math.min(expected, Math.min(flow.reviewTotal, completed.review)
      + Math.min(flow.learnTotal, completed.learn));
    return { achieved, expected, stage: snapshot.stage, phaseDone: snapshot.phaseDone,
      steps: completed };
  }

  // Earlier V1.4 versions accidentally shared flow.learn with a queue that
  // shift() consumed. roundWords retained the original complete list, so
  // recover that manifest without returning answered words to the queue.
  function repairLearnManifest(snapshot) {
    if (!sane(snapshot)) return snapshot;
    if (snapshot.stage !== 'learn' ||
        snapshot.flow.learn.length >= snapshot.flow.learnTotal ||
        snapshot.roundWords.length !== snapshot.flow.learnTotal) return snapshot;
    return {
      ...snapshot,
      flow: { ...snapshot.flow, learn: snapshot.roundWords.slice() },
    };
  }

  return Object.freeze({ VERSION, key, read, write, clear, progress, sane, repairLearnManifest });
});
