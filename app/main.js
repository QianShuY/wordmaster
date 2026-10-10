'use strict';
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { db, seed, parseImportLine, getDatabaseInstanceId } = require('./db');
const Domain = require('../shared/domain');
const DesktopJourney = require('./desktop-journey');
const publicCardCopy = require('../static/cards/card-copy.json');
const hiddenCardCopy = require('./seed/card-copy.hidden.json');

const app = express();
app.use(express.json());
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));
app.use(express.static(path.join(__dirname, '..', 'static')));

const q = {
  books: db.prepare(`
    SELECT b.*,
      (SELECT COUNT(*) FROM words w WHERE w.book_id = b.id) AS word_count,
      (SELECT COUNT(*) FROM words w JOIN progress p ON p.word_id = w.id
        WHERE w.book_id = b.id AND p.streak >= 3) AS mastered,
      (SELECT COUNT(*) FROM words w JOIN progress p ON p.word_id = w.id
        WHERE w.book_id = b.id AND p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')) AS due_review,
      (SELECT COUNT(*) FROM words w JOIN progress p ON p.word_id = w.id
        WHERE w.book_id = b.id AND date(p.first_studied) = date('now', 'localtime')) AS new_today,
      (SELECT COUNT(*) FROM words w JOIN progress p ON p.word_id = w.id
        WHERE w.book_id = b.id AND p.wrong > 0 AND p.streak < 3) AS mistakes
    FROM wordbooks b ORDER BY b.is_builtin DESC, b.id`),
  words: db.prepare('SELECT * FROM words WHERE book_id = ? ORDER BY word'),
  insertBook: db.prepare('INSERT INTO wordbooks (name, description) VALUES (?, ?)'),
  deleteBook: db.prepare('DELETE FROM wordbooks WHERE id = ? AND is_builtin = 0'),
  setPlan: db.prepare('UPDATE wordbooks SET target_date = ?, plan_active = 1 WHERE id = ?'),
  clearPlan: db.prepare('UPDATE wordbooks SET plan_active = 0 WHERE id = ?'),
  insertWord: db.prepare('INSERT INTO words (book_id, word, phonetic, pos, meaning, example) VALUES (?, ?, ?, ?, ?, ?)'),
  updateWord: db.prepare('UPDATE words SET word = ?, phonetic = ?, pos = ?, meaning = ?, example = ? WHERE id = ?'),
  deleteWord: db.prepare('DELETE FROM words WHERE id = ?'),
  // 到期复习词（按到期时间升序，最久未复习的优先）
  dueWords: db.prepare(`
    SELECT w.*, p.streak, p.correct, p.wrong, 0 AS is_new
    FROM words w JOIN progress p ON p.word_id = w.id
    WHERE w.book_id = ? AND p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')
    ORDER BY p.next_due LIMIT ?`),
  // 新词（从未学过）
  newWords: db.prepare(`
    SELECT w.*, 0 AS streak, 0 AS correct, 0 AS wrong, 1 AS is_new
    FROM words w LEFT JOIN progress p ON p.word_id = w.id
    WHERE w.book_id = ? AND p.word_id IS NULL
    ORDER BY RANDOM() LIMIT ?`),
  distractors: db.prepare(`
    SELECT DISTINCT meaning FROM words
    WHERE book_id = ? AND id != ? AND TRIM(meaning) <> TRIM(?) AND TRIM(meaning) <> ''
    ORDER BY RANDOM() LIMIT 30`),
  extraDistractors: db.prepare(`
    SELECT DISTINCT meaning FROM words
    WHERE book_id != ? AND TRIM(meaning) <> TRIM(?) AND TRIM(meaning) <> ''
    ORDER BY RANDOM() LIMIT 30`),
  progress: db.prepare('SELECT streak, first_studied FROM progress WHERE word_id = ?'),
  hasReviewForWord: db.prepare('SELECT 1 AS found FROM review_log WHERE word_id = ? LIMIT 1'),
  lastReviewForSession: db.prepare('SELECT outcome FROM review_log WHERE session_id = ? AND word_id = ? ORDER BY id DESC LIMIT 1'),
  upsertProgress: db.prepare(`
    INSERT INTO progress (word_id, correct, wrong, streak, last_review, next_due, first_studied)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime', ?), datetime('now', 'localtime'))
    ON CONFLICT(word_id) DO UPDATE SET
      correct = correct + excluded.correct,
      wrong = wrong + excluded.wrong,
      streak = excluded.streak,
      last_review = excluded.last_review,
      next_due = excluded.next_due`),
  logReview: db.prepare('INSERT INTO review_log (word_id, correct, is_new, request_id, outcome, session_id, request_payload) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  reviewByRequest: db.prepare('SELECT id, word_id, correct, outcome, request_payload FROM review_log WHERE request_id = ?'),
  mistakes: db.prepare(`
    SELECT w.*, b.name AS book_name, b.is_builtin AS book_is_builtin, p.wrong, p.streak, p.last_review
    FROM progress p JOIN words w ON w.id = p.word_id JOIN wordbooks b ON b.id = w.book_id
    WHERE p.wrong > 0 AND p.streak < 3
    ORDER BY p.wrong DESC, p.last_review DESC`),
  stats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM words) AS total_words,
      (SELECT COUNT(*) FROM review_log WHERE date(ts) = date('now', 'localtime')) AS today_reviewed,
      (SELECT COALESCE(SUM(correct), 0) FROM progress) AS total_correct,
      (SELECT COALESCE(SUM(wrong), 0) FROM progress) AS total_wrong,
      (SELECT COUNT(*) FROM progress WHERE streak >= 3) AS mastered`),
  // XP is a read-only view of real, deduplicated saved answers.
  // Legacy rows with no outcome still count if they were correct.
  journeyTotals: db.prepare(`
    SELECT COUNT(*) AS attempts,
      COALESCE(SUM(CASE
        WHEN outcome = 'retry_correct' THEN 6
        WHEN outcome = 'first_correct' THEN 12
        WHEN outcome IS NULL AND correct = 1 THEN 12
        ELSE 0 END), 0) AS xp
    FROM review_log`),
  // 近 N 天每日学习量
  dailyStats: db.prepare(`
    SELECT date(ts) AS day,
           COUNT(*) AS total,
           SUM(correct) AS correct,
           SUM(is_new) AS new_words
    FROM review_log
    WHERE date(ts) >= date('now', 'localtime', ?)
    GROUP BY date(ts) ORDER BY day`),
  // 有过学习记录的日期（算连续打卡）
  activeDays: db.prepare('SELECT DISTINCT date(ts) AS day FROM review_log ORDER BY day DESC'),
  allCards: db.prepare('SELECT * FROM cards ORDER BY hidden, unlock_at, id'),
  myCards: db.prepare('SELECT card_id, earned_at FROM user_cards'),
  drawCard: db.prepare('INSERT INTO user_cards (card_id) VALUES (?)'),
  todayCard: db.prepare(`
    SELECT card_id FROM card_draws WHERE day = date('now', 'localtime')
    UNION ALL
    SELECT card_id FROM user_cards WHERE date(earned_at) = date('now', 'localtime')
    LIMIT 1`),
  claimCard: db.prepare('INSERT INTO card_draws (day, card_id) VALUES (?, ?)'),
};

function presentWords(words, book) {
  return words.map(word => {
    const presentation = Domain.sampleWordPresentation(word, book);
    return presentation ? { ...word, ...presentation } : word;
  });
}

function presentMistakeWords(words) {
  return words.map(({ book_is_builtin, ...word }) => {
    const presentation = Domain.sampleWordPresentation(word, {
      name: word.book_name,
      is_builtin: book_is_builtin,
    });
    return presentation ? { ...word, ...presentation } : word;
  });
}

// ---- 学习计划：根据目标日期计算每日新词配额 ----
// 剩余新词数 ÷ 剩余天数 = 每天至少新学多少；复习由遗忘曲线自动排
function planFor(book) {
  const totalNew = db.prepare(`
    SELECT COUNT(*) AS c FROM words w LEFT JOIN progress p ON p.word_id = w.id
    WHERE w.book_id = ? AND p.word_id IS NULL`).get(book.id).c;
  return Domain.calculatePlan({
    remainingNew: totalNew,
    dailyNew: book.daily_new,
    planActive: Boolean(book.plan_active),
    targetDate: book.target_date,
  });
}

function attachChoices(words) {
  for (const word of words) {
    // A self-built vocabulary often has fewer than four distinct definitions.
    // Never display a duplicate or a second correct answer: top up from other
    // vocabulary books only when the selected book is too small.
    const seen = new Set([word.meaning.trim().toLocaleLowerCase()]);
    const choices = [word.meaning];
    const addCandidates = rows => {
      for (const row of rows) {
        const text = row.meaning.trim();
        const key = text.toLocaleLowerCase();
        if (!text || seen.has(key)) continue;
        choices.push(text);
        seen.add(key);
        if (choices.length === 4) break;
      }
    };
    addCandidates(q.distractors.all(word.book_id, word.id, word.meaning));
    if (choices.length < 4) addCandidates(q.extraDistractors.all(word.book_id, word.meaning));
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    word.choices = choices;
  }
  return words;
}

app.get('/api/books', (req, res) => {
  const books = q.books.all();
  for (const b of books) b.plan = planFor(b);
  res.json(books);
});

app.post('/api/books', (req, res) => {
  const { name, description = '' } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: '词库名称不能为空' });
  const r = q.insertBook.run(name.trim(), description.trim());
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

app.delete('/api/books/:id', (req, res) => {
  const r = q.deleteBook.run(Number(req.params.id));
  if (r.changes === 0) return res.status(400).json({ error: '内置词库不可删除，或词库不存在' });
  res.json({ ok: true });
});

// 学习计划：设定目标学完日期，系统自动分配每日新词量
app.put('/api/books/:id/plan', (req, res) => {
  const { target_date } = req.body || {};
  const id = Number(req.params.id);
  const book = db.prepare('SELECT * FROM wordbooks WHERE id = ?').get(id);
  if (!book) return res.status(404).json({ error: '词库不存在' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target_date || '')) return res.status(400).json({ error: '目标日期格式应为 YYYY-MM-DD' });
  const target = new Date(target_date + 'T00:00:00');
  if (Domain.localDayKey(target) !== target_date) return res.status(400).json({ error: '目标日期不是有效日期' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (target < today) return res.status(400).json({ error: '目标日期不能早于今天' });
  q.setPlan.run(target_date, id);
  res.json({ ok: true, plan: planFor({ ...book, plan_active: 1, target_date }) });
});

app.delete('/api/books/:id/plan', (req, res) => {
  q.clearPlan.run(Number(req.params.id));
  res.json({ ok: true });
});

app.get('/api/books/:id/words', (req, res) => {
  const bookId = Number(req.params.id);
  const book = db.prepare('SELECT id, name, is_builtin FROM wordbooks WHERE id = ?').get(bookId);
  res.json(presentWords(q.words.all(bookId), book));
});

// Desktop manager: server-side search + pagination keeps large built-in books
// usable without materializing thousands of table rows in the browser.
// The original /api/books/:id/words contract is preserved for Android.
app.get('/api/desktop/books/:id/words', (req, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isSafeInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: '无效的词库 ID' });
  }
  const book = db.prepare('SELECT id, name, is_builtin FROM wordbooks WHERE id = ?').get(bookId);
  if (!book) return res.status(404).json({ error: '词库不存在' });

  const keyword = String(req.query.search || '').trim();
  const status = String(req.query.status || 'all');
  const allowed = new Set(['all', 'new', 'due', 'mistakes', 'mastered']);
  if (keyword.length > 80) return res.status(400).json({ error: '搜索内容不能超过 80 个字符' });
  if (!allowed.has(status)) return res.status(400).json({ error: '无效的学习状态筛选' });
  const requestedPage = Number(req.query.page || 1);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
    return res.status(400).json({ error: '页码必须是正整数' });
  }
  const requestedSize = Number(req.query.page_size || 40);
  if (!Number.isSafeInteger(requestedSize) || requestedSize < 1 || requestedSize > 100) {
    return res.status(400).json({ error: '每页数量须在 1–100 之间' });
  }

  const filters = {
    all: '',
    new: ' AND p.word_id IS NULL',
    due: " AND p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')",
    mistakes: ' AND p.wrong > 0 AND p.streak < 3',
    mastered: ' AND p.streak >= 3',
  };
  // instr() handles literal percent/underscore without interpreting LIKE wildcards.
  const matchSql = keyword ? ' AND (instr(lower(w.word), lower(?)) > 0 OR instr(lower(w.meaning), lower(?)) > 0)' : '';
  const where = 'WHERE w.book_id = ?' + filters[status] + matchSql;
  const args = keyword ? [bookId, keyword, keyword] : [bookId];
  const from = 'FROM words w LEFT JOIN progress p ON p.word_id = w.id ';
  const total = db.prepare('SELECT COUNT(*) AS total ' + from + where).get(...args).total;
  const pages = Math.max(1, Math.ceil(total / requestedSize));
  const page = Math.min(requestedPage, pages);
  const rows = db.prepare(`SELECT w.*, p.streak, p.correct, p.wrong, p.next_due
    ${from}${where} ORDER BY w.word COLLATE NOCASE, w.id LIMIT ? OFFSET ?`)
    .all(...args, requestedSize, (page - 1) * requestedSize);
  res.set('Cache-Control', 'no-store').json({
    items: presentWords(rows, book), total, page, page_size: requestedSize, pages,
    search: keyword, status,
  });
});

app.post('/api/words', (req, res) => {
  const { book_id, word, phonetic = '', pos = '', meaning, example = '' } = req.body || {};
  if (!book_id || !word || !meaning) return res.status(400).json({ error: '单词和释义必填' });
  try {
    const r = q.insertWord.run(book_id, word.trim(), phonetic.trim(), pos.trim(), meaning.trim(), example.trim());
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (e) {
    res.status(409).json({ error: '该单词已存在于此词库' });
  }
});

// 批量导入：{ book_id, text }，每行一个词，支持 "word [音标] 词性. 释义" / "word 词性. 释义" / "word<TAB>释义" / "word,释义"
app.post('/api/books/:id/import', (req, res) => {
  const { text } = req.body || {};
  const bookId = Number(req.params.id);
  if (!text || !text.trim()) return res.status(400).json({ error: '导入内容为空' });
  if (!db.prepare('SELECT id FROM wordbooks WHERE id = ?').get(bookId)) return res.status(404).json({ error: '词库不存在' });
  let added = 0, dup = 0;
  const badLines = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const p = parseImportLine(line);
    if (!p) { badLines.push(line.trim().slice(0, 60)); continue; }
    try {
      q.insertWord.run(bookId, p.word, p.phonetic, p.pos, p.meaning, '');
      added++;
    } catch (e) { dup++; }
  }
  res.json({ added, dup, bad: badLines.slice(0, 20), bad_total: badLines.length });
});

app.put('/api/words/:id', (req, res) => {
  const { word, phonetic = '', pos = '', meaning, example = '' } = req.body || {};
  if (!word || !meaning) return res.status(400).json({ error: '单词和释义必填' });
  const r = q.updateWord.run(word.trim(), phonetic.trim(), pos.trim(), meaning.trim(), example.trim(), Number(req.params.id));
  if (r.changes === 0) return res.status(404).json({ error: '单词不存在' });
  res.json({ ok: true });
});

app.delete('/api/words/:id', (req, res) => {
  q.deleteWord.run(Number(req.params.id));
  res.json({ ok: true });
});

// 学习取词：到期复习优先，再按计划配额补新词
app.get('/api/books/:id/study', (req, res) => {
  const bookId = Number(req.params.id);
  const book = db.prepare('SELECT * FROM wordbooks WHERE id = ?').get(bookId);
  if (!book) return res.status(404).json({ error: '词库不存在' });
  const mode = req.query.mode;
  const wantAll = req.query.all === '1'; // 错题本等场景取全部到期词

  // 学词模式：只取新词，不看复习
  if (mode === 'learn') {
    const plan = planFor(book);
    const newToday = countNewToday(bookId);
    const requested = Number(req.query.limit);
    const limits = Domain.calculateStudyQueueLimits({
      mode, dailyQuota: plan.daily_quota, newToday, wantAll, requestedLimit: requested,
    });
    return res.json(presentWords(q.newWords.all(bookId, limits.new_limit), book));
  }

  const plan = planFor(book);
  const limits = Domain.calculateStudyQueueLimits({
    mode, dailyQuota: plan.daily_quota, newToday: countNewToday(bookId), wantAll,
  });
  // Desktop may request bite-size sessions (10/20/40 questions). Android and
  // existing consumers omit this option and retain their original queue sizes.
  const requestedSessionLimit = req.query.session_limit;
  let roundLimit = null;
  if (requestedSessionLimit !== undefined && mode !== 'learn') {
    const parsed = Number(requestedSessionLimit);
    if (!Number.isSafeInteger(parsed) || parsed < 5 || parsed > 50) {
      return res.status(400).json({ error: '每轮练习数量必须为 5–50' });
    }
    roundLimit = parsed;
  }
  const due = q.dueWords.all(bookId, Math.min(limits.due_limit, roundLimit || limits.due_limit));
  const remaining = roundLimit === null ? limits.new_limit : Math.min(limits.new_limit, Math.max(0, roundLimit - due.length));
  const fresh = q.newWords.all(bookId, remaining);
  const words = Domain.composeStudyQueue(due, fresh, { ...limits, due_limit: due.length, new_limit: remaining });
  if (mode === 'meaning') attachChoices(words);
  res.json(presentWords(words, book));
});

app.get('/api/desktop/identity', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ instance_id: getDatabaseInstanceId() });
});

// The Desktop "Today" experience follows the real plan, not an arbitrary
// ten/twenty/forty-question limit. Review and new words are separate phases
// of a single guided task. Existing mobile study endpoints are unchanged.
app.get('/api/desktop/books/:id/today', (req, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isSafeInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: '无效的词库 ID' });
  }
  const book = db.prepare('SELECT * FROM wordbooks WHERE id = ?').get(bookId);
  if (!book) return res.status(404).json({ error: '词库不存在' });
  const plan = planFor(book);
  const newToday = countNewToday(bookId);
  const dueTotal = db.prepare(`SELECT COUNT(*) AS total FROM words w JOIN progress p
    ON p.word_id = w.id WHERE w.book_id = ? AND p.next_due IS NOT NULL
    AND p.next_due <= datetime('now', 'localtime')`).get(bookId).total;
  const due = q.dueWords.all(bookId, Math.min(200, dueTotal));
  const newRemaining = Math.min(plan.remaining_new, Math.max(0, plan.daily_quota - newToday));
  const fresh = q.newWords.all(bookId, Math.min(200, newRemaining));
  attachChoices(due);
  res.set('Cache-Control', 'no-store').json({
    book_id: bookId,
    review: presentWords(due, book),
    learn: presentWords(fresh, book),
    due_total: dueTotal,
    new_remaining: newRemaining,
    review_has_more: dueTotal > due.length,
    learn_has_more: newRemaining > fresh.length,
  });
});

function countNewToday(bookId) {
  return db.prepare(`
    SELECT COUNT(*) AS c FROM progress p JOIN words w ON w.id = p.word_id
    WHERE w.book_id = ? AND date(p.first_studied) = date('now', 'localtime')`).get(bookId).c;
}

// 错题本
app.get('/api/mistakes', (req, res) => res.json(presentMistakeWords(q.mistakes.all())));

app.get('/api/mistakes/study', (req, res) => {
  let words = presentMistakeWords(q.mistakes.all()).slice(0, 30);
  words.sort(() => Math.random() - 0.5);
  if (req.query.mode === 'meaning') attachChoices(words);
  res.json(words);
});

app.delete('/api/mistakes/:wordId', (req, res) => {
  // 从错题本移除（清零 wrong 计数，保留复习进度）
  db.prepare('UPDATE progress SET wrong = 0 WHERE word_id = ?').run(Number(req.params.wordId));
  res.json({ ok: true });
});

app.post('/api/progress', (req, res) => {
  const { word_id, correct, is_new, request_id, session_id, outcome } = req.body || {};
  const wordId = Number(word_id);
  if (!Number.isSafeInteger(wordId) || wordId < 1) return res.status(400).json({ error: '缺少有效的 word_id' });
  if (typeof correct !== 'boolean') return res.status(400).json({ error: 'correct 必须是布尔值' });
  if (is_new !== undefined && typeof is_new !== 'boolean') return res.status(400).json({ error: 'is_new 必须是布尔值' });
  if (typeof request_id !== 'string' || request_id.length < 8 || request_id.length > 128) {
    return res.status(400).json({ error: '缺少有效的 request_id' });
  }
  if (typeof session_id !== 'string' || session_id.length < 8 || session_id.length > 128) {
    return res.status(400).json({ error: '缺少有效的 session_id' });
  }
  if (correct ? !['first_correct', 'retry_correct'].includes(outcome) : !['wrong', 'abandoned'].includes(outcome)) {
    return res.status(400).json({ error: '答题结果类型无效' });
  }
  const isNewRequest = Boolean(is_new);
  const requestPayload = JSON.stringify({
    word_id: wordId,
    correct,
    is_new: isNewRequest,
    session_id,
    outcome,
  });

  db.exec('BEGIN IMMEDIATE');
  try {
    const priorRequest = q.reviewByRequest.get(request_id);
    if (priorRequest) {
      const sameRequest = priorRequest.request_payload !== null
        ? priorRequest.request_payload === requestPayload
        : priorRequest.word_id === wordId && Boolean(priorRequest.correct) === correct;
      if (!sameRequest) {
        db.exec('ROLLBACK');
        return res.status(409).json({ error: 'request_id 已用于不同的答题内容' });
      }
      const current = q.progress.get(priorRequest.word_id);
      db.exec('COMMIT');
      return res.json({ ok: true, duplicate: true, streak: current ? current.streak : 0, outcome: priorRequest.outcome });
    }

    const exists = db.prepare('SELECT 1 AS found FROM words WHERE id = ?').get(wordId);
    if (!exists) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: '单词不存在' });
    }
    const current = q.progress.get(wordId);
    const streak = Domain.nextStreak(current ? current.streak : 0, correct);
    const due = Domain.nextDueModifier(correct, streak);
    const hadReview = Boolean(q.hasReviewForWord.get(wordId));
    const firstStudiedToday = current?.first_studied && String(current.first_studied).slice(0, 10) === Domain.localDayKey();
    const newFlag = Boolean(is_new || firstStudiedToday) && !hadReview;
    const previousOutcome = q.lastReviewForSession.get(session_id, wordId)?.outcome;
    const savedOutcome = Domain.classifyOutcome(
      correct,
      ['wrong', 'abandoned'].includes(previousOutcome),
      outcome,
    );
    q.upsertProgress.run(wordId, correct ? 1 : 0, correct ? 0 : 1, streak, due);
    q.logReview.run(wordId, correct ? 1 : 0, newFlag ? 1 : 0, request_id, savedOutcome, session_id, requestPayload);
    db.exec('COMMIT');
    return res.json({ ok: true, duplicate: false, streak, outcome: savedOutcome });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('[progress] 保存失败:', error.message);
    return res.status(500).json({ error: '保存失败，请重试' });
  }
});

// 学词模式：标记单词已学，立即进入默写队列（不计对错）
app.post('/api/learn', (req, res) => {
  const wordId = Number((req.body || {}).word_id);
  if (!Number.isSafeInteger(wordId) || wordId < 1) {
    return res.status(400).json({ error: '缺少有效的 word_id' });
  }
  if (!db.prepare('SELECT 1 FROM words WHERE id = ?').get(wordId)) {
    return res.status(404).json({ error: '单词不存在' });
  }
  db.prepare(`
    INSERT INTO progress (word_id, correct, wrong, streak, last_review, next_due, first_studied)
    VALUES (?, 0, 0, 0, datetime('now', 'localtime'), datetime('now', 'localtime'), datetime('now', 'localtime'))
    ON CONFLICT(word_id) DO NOTHING`).run(wordId);
  res.json({ ok: true });
});

// Desktop-only full data backup: SQLite builds a consistent live snapshot without
// copying a potentially incomplete database file while the server is running.
app.get('/api/backup', (req, res) => {
  const remote = req.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) {
    return res.status(403).json({ error: '学习数据只能在本机备份' });
  }
  let tempDir;
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wordmaster-backup-'));
    const snapshotPath = path.join(tempDir, 'wordmaster.db');
    db.prepare('VACUUM INTO ?').run(snapshotPath);
    res.set('Cache-Control', 'no-store');
    res.download(snapshotPath, `WordMaster-backup-${Domain.localDayKey()}.db`, { cacheControl: false }, error => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); }
      catch (cleanupError) { console.error('[backup] 清理临时文件失败:', cleanupError.message); }
      if (error) {
        console.error('[backup] 下载未完成:', error.message);
        if (!res.headersSent) res.status(500).json({ error: '备份下载失败，请重试' });
      }
    });
  } catch (error) {
    if (tempDir) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); }
      catch (cleanupError) { console.error('[backup] 清理临时文件失败:', cleanupError.message); }
    }
    console.error('[backup] 创建快照失败:', error.message);
    return res.status(500).json({ error: '备份失败，请检查磁盘空间后重试' });
  }
});

app.get('/api/stats', (req, res) => res.json(q.stats.get()));

// Desktop-only read-only achievements and recent learning activity. Android
// uses an independent SQLite store and does not call this endpoint.
app.get('/api/desktop/journey', (req, res) => {
  res.set('Cache-Control', 'no-store').json(DesktopJourney.buildJourney({
    totals: q.journeyTotals.get(),
    activeDays: q.activeDays.all(),
    daily: q.dailyStats.all('-6 days'),
    mastered: q.stats.get().mastered,
    ownedCards: q.myCards.all().length,
    drawnToday: !!q.todayCard.get(),
  }));
});

// ---- 学习数据统计 ----
app.get('/api/stats/daily', (req, res) => {
  const days = Math.min(Number(req.query.days) || 90, 365);
  if (req.query.book_id === undefined) return res.json(q.dailyStats.all(`-${days} days`));
  const bookId = Number(req.query.book_id);
  if (!Number.isSafeInteger(bookId) || bookId < 1) return res.status(400).json({ error: '无效的词库 ID' });
  if (!db.prepare('SELECT 1 FROM wordbooks WHERE id = ?').get(bookId)) return res.status(404).json({ error: '词库不存在' });
  res.json(db.prepare(`
    SELECT date(l.ts) AS day, COUNT(*) AS total, SUM(l.correct) AS correct,
           SUM(l.is_new) AS new_words
    FROM review_log l JOIN words w ON w.id = l.word_id
    WHERE w.book_id = ? AND date(l.ts) >= date('now', 'localtime', ?)
    GROUP BY date(l.ts) ORDER BY day`).all(bookId, `-${days} days`));
});

app.get('/api/stats/overview', (req, res) => {
  // A desktop book_id requests *one* book. No parameter retains the original
  // global shape consumed by Android. Explicit scope=all avoids presenting the
  // sum of unrelated daily quotas as one actionable learning target.
  const scoped = req.query.book_id !== undefined;
  const bookId = scoped ? Number(req.query.book_id) : null;
  if (scoped && (!Number.isSafeInteger(bookId) || bookId < 1)) {
    return res.status(400).json({ error: '无效的词库 ID' });
  }
  const books = q.books.all();
  const book = scoped ? books.find(item => item.id === bookId) : null;
  if (scoped && !book) return res.status(404).json({ error: '词库不存在' });
  const days = (scoped ? db.prepare(`SELECT DISTINCT date(l.ts) AS day FROM review_log l
    JOIN words w ON w.id = l.word_id WHERE w.book_id = ? ORDER BY day DESC`).all(bookId)
    : q.activeDays.all()).map(row => row.day);
  let streak = 0;
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  if (!days.includes(Domain.localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.includes(Domain.localDayKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  const today = scoped ? {
    due_review: book.due_review,
    new_today: book.new_today,
    daily_new_quota: Math.min(planFor(book).daily_quota, book.new_today + planFor(book).remaining_new),
  } : {
    due_review: books.reduce((sum, item) => sum + item.due_review, 0),
    new_today: books.reduce((sum, item) => sum + item.new_today, 0),
    daily_new_quota: req.query.scope === 'all' ? null
      : books.reduce((sum, item) => sum + planFor(item).daily_quota, 0),
  };
  const total = scoped ? db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM words WHERE book_id = ?) AS total_words,
      (SELECT COUNT(*) FROM review_log l JOIN words w ON w.id = l.word_id
        WHERE w.book_id = ? AND date(l.ts) = date('now', 'localtime')) AS today_reviewed,
      (SELECT COALESCE(SUM(p.correct), 0) FROM progress p JOIN words w ON w.id = p.word_id
        WHERE w.book_id = ?) AS total_correct,
      (SELECT COALESCE(SUM(p.wrong), 0) FROM progress p JOIN words w ON w.id = p.word_id
        WHERE w.book_id = ?) AS total_wrong,
      (SELECT COUNT(*) FROM progress p JOIN words w ON w.id = p.word_id
        WHERE w.book_id = ? AND p.streak >= 3) AS mastered`).get(bookId, bookId, bookId, bookId, bookId)
    : q.stats.get();
  const accuracy = total.total_correct + total.total_wrong > 0
    ? Math.round(total.total_correct / (total.total_correct + total.total_wrong) * 100) : 0;
  res.set('Cache-Control', 'no-store').json({ streak, today, total, accuracy, scope: scoped ? 'book' : 'all' });
});

// ---- 卡牌 ----
app.get('/api/cards/copy', (req, res) => {
  const mine = new Set(q.myCards.all().map(c => c.card_id));
  const unlockedHidden = new Set(q.allCards.all()
    .filter(c => c.hidden && mine.has(c.id))
    .map(c => c.palette));
  const hidden = Object.fromEntries(Object.entries(hiddenCardCopy)
    .filter(([palette]) => unlockedHidden.has(palette)));
  res.set('Cache-Control', 'no-store').json({ ...publicCardCopy, ...hidden });
});

app.get('/api/cards', (req, res) => {
  const all = q.allCards.all();
  const mine = new Map(q.myCards.all().map(c => [c.card_id, c.earned_at]));
  const todayAnswered = q.stats.get().today_reviewed;
  res.json({
    cards: all.map(c => ({
      ...c,
      owned: mine.has(c.id),
      earned_at: mine.get(c.id) || null,
      // 未解锁的隐藏卡不透露内容
      ...(c.hidden && !mine.has(c.id) ? { title: '???', flavor: '集齐更多卡牌后解锁', palette: 'locked' } : {}),
    })),
    owned: mine.size,
    drawn_today: !!q.todayCard.get(),
    today_answered: todayAnswered,
    draw_target: 10,
  });
});

// 完成当日学习计划后抽一张卡（每天限一张）
app.post('/api/cards/draw', (req, res) => {
  db.exec('BEGIN IMMEDIATE');
  try {
    if (q.todayCard.get()) {
      db.exec('ROLLBACK');
      return res.status(409).json({ error: '今天已经抽过卡了，明天再来' });
    }
    const ov = q.stats.get();
    if (!Domain.qualifiesForCard(ov.today_reviewed)) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: '先完成今天的学习（至少 10 次作答）再来抽卡' });
    }

    const mine = new Set(q.myCards.all().map(c => c.card_id));
    const pool = q.allCards.all().filter(c => !c.hidden && !mine.has(c.id));
    const card = Domain.pickWeightedCard(pool, Math.random());
    if (!card) {
      const normals = q.allCards.all().filter(c => !c.hidden);
      const sample = normals[Math.floor(Math.random() * normals.length)] || null;
      q.claimCard.run(Domain.localDayKey(), null);
      db.exec('COMMIT');
      return res.json({ card: null, duplicate: true, message: '普通卡已全部集齐！今日好运转化为双倍墨香。', sample });
    }

    q.drawCard.run(card.id);
    const owned = mine.size + 1;
    const unlocked = q.allCards.all().filter(c => c.hidden && !mine.has(c.id) && owned >= c.unlock_at);
    for (const hidden of unlocked) q.drawCard.run(hidden.id);
    q.claimCard.run(Domain.localDayKey(), card.id);
    db.exec('COMMIT');
    return res.json({ card, unlocked, owned: owned + unlocked.length });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    console.error('[cards] 抽卡失败:', error.message);
    return res.status(500).json({ error: '抽卡失败，请重试' });
  }
});

if (require.main === module) {
  seed();
  const PORT = process.env.PORT || 3456;
  const HOST = process.env.WORDMASTER_HOST || '127.0.0.1';
  app.listen(PORT, HOST, () => console.log(`WordMaster 已启动: http://${HOST}:${PORT}`));
}

module.exports = { app, db };
