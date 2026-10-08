import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const adapterSource = readFileSync(fileURLToPath(new URL('../src/native-api.js', import.meta.url)), 'utf8');

function makeAdapter() {
  const calls = {};
  const books = [{
    book_key: 'builtin:test', legacy_id: 4, name: '测试词库', description: '', is_builtin: 1,
    word_count: 2, mastered: 0, due_review: 0, new_today: 0,
    plan: { active: false, daily_quota: 15, remaining_new: 2, days_left: null },
  }];
  const words = [{
    word_key: 'builtin:test:entry:000001', legacy_id: 17, book_key: 'builtin:test', word: 'mother-in-law',
    meaning: '岳母；婆婆', pos: 'n.', phonetic: '', example: '', is_new: true,
  }];
  const store = {
    listBooks: async () => ({ books }),
    getStudyQueue: async args => { calls.queue = args; return { words }; },
    listWords: async args => { calls.listWords = args; return { words }; },
    submitAnswer: async args => { calls.answer = args; return { ok: true, correct: true, outcome: 'first_correct' }; },
    createBook: async args => { calls.createBook = args; books.push({ ...args, book_key: 'user:test', legacy_id: 5, is_builtin: 0 }); return { id: 5, book_key: 'user:test' }; },
    importWords: async args => { calls.importWords = args; return { added: 1, dup: 0, bad: [], bad_total: 0 }; },
  };
  const window = {
    Capacitor: { registerPlugin: name => { assert.equal(name, 'WordmasterStore'); return store; } },
    WordMasterDomain: {
      sampleWordPresentation(word, book) {
        if (book.is_builtin && word.word === 'cardinal 2') return { answer_word: 'cardinal', display_word: 'cardinal', sense_label: '同形词 II' };
        return null;
      },
    },
  };
  vm.runInNewContext(adapterSource, { window, URL, Map, Number, String, Boolean, Error });
  return { adapter: window.WordMasterNativeApi, calls };
}

test('native adapter maps stable keys to the Web numeric API contract and verifies the entered answer', async () => {
  const { adapter, calls } = makeAdapter();
  const books = await adapter.request('/api/books');
  assert.equal(books[0].id, 4);
  assert.equal(books[0].book_key, 'builtin:test');

  const words = await adapter.request('/api/books/4/study?mode=spelling&limit=3');
  assert.equal(calls.queue.bookKey, 'builtin:test');
  assert.equal(calls.queue.mode, 'spelling');
  assert.equal(calls.queue.limit, 3);
  assert.equal(words[0].id, 17);
  assert.equal(words[0].book_id, 4);

  const result = await adapter.request('/api/progress', { method: 'POST', body: {
    word_id: 17, correct: true, is_new: true, request_id: 'request-adapter-0001',
    session_id: 'session-adapter-0001', outcome: 'first_correct',
    judgement_mode: 'spelling', answer_value: ' MOTHER-IN-LAW ',
  } });
  assert.equal(result.outcome, 'first_correct');
  assert.equal(calls.answer.wordKey, 'builtin:test:entry:000001');
  assert.equal(calls.answer.answer, ' MOTHER-IN-LAW ');
  assert.equal(calls.answer.mode, 'spelling');
  assert.equal(calls.answer.sessionId, 'session-adapter-0001');
});

test('native adapter preserves card and editable wordbook endpoint responses', async () => {
  const { adapter, calls } = makeAdapter();
  const words = await adapter.request('/api/books/4/words');
  assert.equal(words[0].word_key, 'builtin:test:entry:000001');
  assert.equal(calls.listWords.bookKey, 'builtin:test');

  const created = await adapter.request('/api/books', { method: 'POST', body: { name: '我的词库', description: '记新词' } });
  assert.equal(created.id, 5);
  assert.equal(calls.createBook.name, '我的词库');

  const imported = await adapter.request('/api/books/4/import', { method: 'POST', body: {
    text: 'moon [muːn] n. 月亮\nthis is not a word row',
  } });
  assert.equal(calls.importWords.bookKey, 'builtin:test');
  assert.deepEqual(Array.from(calls.importWords.words, word => [word.word, word.pos, word.meaning]), [['moon', 'n.', '月亮']]);
  assert.equal(imported.bad_total, 1);
});
