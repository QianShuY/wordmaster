'use strict';

// Android implementation of the same /api/* contract used by the desktop app.
// All requests stay inside the Capacitor bridge and the app-private SQLite DB.
(() => {
  if (!window.Capacitor?.registerPlugin) return;

  const Store = window.Capacitor.registerPlugin('WordmasterStore');
  const booksById = new Map();
  const booksByKey = new Map();
  const wordsById = new Map();
  const answersByWordId = new Map();

  function apiError(error) {
    const wrapped = new Error(error?.message || '本地操作失败，请重试。');
    wrapped.code = error?.code || 'STORAGE_UNAVAILABLE';
    return wrapped;
  }

  async function invoke(promise) {
    try { return await promise; } catch (error) { throw apiError(error); }
  }

  function mapBook(book) {
    const mapped = { ...book, id: Number(book.legacy_id), is_builtin: Number(book.is_builtin) };
    booksById.set(mapped.id, mapped);
    booksByKey.set(mapped.book_key, mapped);
    return mapped;
  }

  async function listBooks() {
    const response = await invoke(Store.listBooks());
    booksById.clear();
    booksByKey.clear();
    return response.books.map(mapBook);
  }

  async function bookForId(id) {
    const numericId = Number(id);
    if (!booksById.has(numericId)) await listBooks();
    const book = booksById.get(numericId);
    if (!book) throw new Error('词库不存在');
    return book;
  }

  function mapWord(word, book = booksByKey.get(word.book_key)) {
    const mapped = {
      ...word,
      id: Number(word.legacy_id),
      book_id: book ? book.id : Number(word.book_id),
      book_name: word.book_name || book?.name || '',
      book_is_builtin: word.book_is_builtin ?? book?.is_builtin ?? 0,
    };
    const presentation = window.WordMasterDomain?.sampleWordPresentation(mapped, {
      name: mapped.book_name,
      is_builtin: mapped.book_is_builtin,
    });
    const presented = presentation ? { ...mapped, ...presentation } : mapped;
    if (Number.isFinite(presented.id)) {
      wordsById.set(presented.id, presented.word_key);
      answersByWordId.set(presented.id, presented.answer_word || presented.word);
    }
    return presented;
  }

  async function wordKeyForId(id) {
    const wordId = Number(id);
    if (!wordsById.has(wordId)) throw new Error('单词映射已失效，请返回后重新打开当前页面');
    return wordsById.get(wordId);
  }

  function parseLine(line) {
    const value = String(line || '').trim();
    if (!value) return null;
    const match = value.match(/^(.+?)\s*(?:\[([^\]]*)\])?\s+([a-z./&]+\.?)\s*[.:．]?\s*(.+)$/i);
    if (!match) return null;
    let [, word, phonetic, pos, meaning] = match;
    word = word.trim().replace(/^\*+/, '');
    if (/^[A-Z]$/.test(word) || /[一-龥]/.test(word)) return null;
    meaning = meaning.replace(/[\s ]+$/g, '').trim();
    if (!meaning || !/[一-龥]/.test(meaning)) return null;
    return { word, phonetic: (phonetic || '').trim(), pos: pos.trim(), meaning, example: '' };
  }

  function parseImportLine(line) {
    const value = String(line || '').trim();
    if (!value) return null;
    const standard = parseLine(value);
    if (standard) return standard;
    const parts = value.split(/\t|,|，/).map(part => part.trim()).filter(Boolean);
    if (parts.length >= 2 && !/[一-龥]/.test(parts[0])) {
      const [word, first, second] = parts;
      if (parts.length >= 3 && /^[a-z./&]+\.?$/i.test(first)) {
        return { word, phonetic: '', pos: first, meaning: second, example: '' };
      }
      return { word: parts[0], phonetic: '', pos: '', meaning: parts.slice(1).join('，'), example: '' };
    }
    const loose = value.match(/^([A-Za-z][A-Za-z\-' ]*?)\s+(.+[一-龥].*)$/);
    return loose ? { word: loose[1].trim(), phonetic: '', pos: '', meaning: loose[2].trim(), example: '' } : null;
  }

  async function request(rawUrl, options = {}) {
    const parsed = new URL(String(rawUrl), 'https://localhost');
    const path = parsed.pathname;
    const method = String(options.method || 'GET').toUpperCase();
    const body = options.body || {};

    if (path === '/api/books' && method === 'GET') return listBooks();
    if (path === '/api/books' && method === 'POST') {
      const created = await invoke(Store.createBook({ name: body.name, description: body.description || '' }));
      await listBooks();
      return { id: Number(created.id) };
    }
    let match = path.match(/^\/api\/books\/(\d+)$/);
    if (match && method === 'DELETE') {
      const book = await bookForId(match[1]);
      const result = await invoke(Store.deleteBook({ bookKey: book.book_key }));
      await listBooks();
      return result;
    }
    match = path.match(/^\/api\/books\/(\d+)\/plan$/);
    if (match && method === 'PUT') {
      const book = await bookForId(match[1]);
      return invoke(Store.setPlan({ bookKey: book.book_key, targetDate: body.target_date }));
    }
    if (match && method === 'DELETE') {
      const book = await bookForId(match[1]);
      return invoke(Store.clearPlan({ bookKey: book.book_key }));
    }
    match = path.match(/^\/api\/books\/(\d+)\/words$/);
    if (match && method === 'GET') {
      const book = await bookForId(match[1]);
      const response = await invoke(Store.listWords({ bookKey: book.book_key }));
      return response.words.map(word => mapWord(word, book));
    }
    match = path.match(/^\/api\/books\/(\d+)\/study$/);
    if (match && method === 'GET') {
      const book = await bookForId(match[1]);
      const response = await invoke(Store.getStudyQueue({
        bookKey: book.book_key,
        mode: parsed.searchParams.get('mode') || 'spelling',
        all: parsed.searchParams.get('all') === '1',
        limit: Number(parsed.searchParams.get('limit')) || 50,
      }));
      return response.words.map(word => mapWord(word, book));
    }
    match = path.match(/^\/api\/books\/(\d+)\/import$/);
    if (match && method === 'POST') {
      const book = await bookForId(match[1]);
      const entries = [];
      const bad = [];
      for (const rawLine of String(body.text || '').split(/\r?\n/)) {
        if (!rawLine.trim()) continue;
        const parsedWord = parseImportLine(rawLine);
        if (parsedWord) entries.push(parsedWord);
        else bad.push(rawLine.trim().slice(0, 60));
      }
      const imported = await invoke(Store.importWords({ bookKey: book.book_key, words: entries }));
      return { ...imported, bad: bad.slice(0, 20), bad_total: bad.length };
    }

    match = path.match(/^\/api\/words$/);
    if (match && method === 'POST') {
      const book = await bookForId(body.book_id);
      const created = await invoke(Store.addWord({
        bookKey: book.book_key, word: body.word, phonetic: body.phonetic || '',
        pos: body.pos || '', meaning: body.meaning, example: body.example || '',
      }));
      wordsById.set(Number(created.id), created.word_key);
      return { id: Number(created.id) };
    }
    match = path.match(/^\/api\/words\/(\d+)$/);
    if (match && method === 'PUT') {
      return invoke(Store.updateWord({
        wordKey: await wordKeyForId(match[1]), word: body.word, phonetic: body.phonetic || '',
        pos: body.pos || '', meaning: body.meaning, example: body.example || '',
      }));
    }
    if (match && method === 'DELETE') return invoke(Store.deleteWord({ wordKey: await wordKeyForId(match[1]) }));

    if (path === '/api/mistakes' && method === 'GET') {
      const response = await invoke(Store.listMistakes());
      return response.words.map(word => mapWord(word));
    }
    match = path.match(/^\/api\/mistakes\/study$/);
    if (match && method === 'GET') {
      const response = await invoke(Store.getMistakeQueue({ mode: parsed.searchParams.get('mode') || 'spelling' }));
      return response.words.map(word => mapWord(word));
    }
    match = path.match(/^\/api\/mistakes\/(\d+)$/);
    if (match && method === 'DELETE') return invoke(Store.clearMistake({ wordKey: await wordKeyForId(match[1]) }));

    if (path === '/api/progress' && method === 'POST') {
      const wordKey = await wordKeyForId(body.word_id);
      return invoke(Store.submitAnswer({
        wordKey, requestId: body.request_id, answer: body.answer_value || '',
        expectedWord: answersByWordId.get(Number(body.word_id)) || '',
        mode: body.judgement_mode || 'spelling', sessionId: body.session_id,
        isNew: Boolean(body.is_new), outcome: body.outcome || '',
      }));
    }
    if (path === '/api/learn' && method === 'POST') {
      return invoke(Store.markLearned({ wordKey: await wordKeyForId(body.word_id) }));
    }
    if (path === '/api/stats' && method === 'GET') return invoke(Store.getStats());
    if (path === '/api/stats/daily' && method === 'GET') {
      const response = await invoke(Store.getDailyStats({ days: Number(parsed.searchParams.get('days')) || 90 }));
      return response.days;
    }
    if (path === '/api/stats/overview' && method === 'GET') return invoke(Store.getOverview());
    if (path === '/api/cards/copy' && method === 'GET') return invoke(Store.getCardCopy());
    if (path === '/api/cards' && method === 'GET') return invoke(Store.getCards());
    if (path === '/api/cards/draw' && method === 'POST') return invoke(Store.drawCard());
    throw new Error(`Android 本地服务尚未实现：${method} ${path}`);
  }

  window.WordMasterNativeApi = {
    request,
    exitApp: () => invoke(Store.exitApp()),
  };
})();
