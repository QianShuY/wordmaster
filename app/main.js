'use strict';
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { db, seed, installBookContent, parseImportLine, getDatabaseInstanceId } = require('./db');
const Domain = require('../shared/domain');
const LearningContext = require('../shared/learning-context');
const DesktopJourney = require('./desktop-journey');
const LearningInsights = require('./learning-insights');
const BattlePool = require('./battle-pool');
const ReviewCycle = require('./review-cycle');
const {unfinishedWords}=require('./unfinished-learning');
const WordMemory = require('./word-memory').createWordMemory(db);
const VocabularyHistory = require('./vocabulary-history').create(db);
const DailyWorkload = require('./daily-workload').createDailyWorkload(db);
const Campaign = require('./campaign').createCampaign(db,planFor,
  (book,plan)=>DailyWorkload.saved(book.id)?DailyWorkload.get(book,plan):null,
  (book,plan)=>DailyWorkload.get(book,plan));
const publicCardCopy = require('../static/cards/card-copy.json');
const hiddenCardCopy = require('./seed/card-copy.hidden.json');
function adventurePool(){
 const rows=db.prepare(`SELECT w.*,b.name book_name,p.first_studied battle_first_studied,p.last_review battle_last_review,p.wrong battle_wrong FROM words w JOIN wordbooks b ON b.id=w.book_id
 JOIN progress p ON p.word_id=w.id WHERE b.is_builtin=1 AND p.first_studied IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id)
 AND EXISTS(SELECT 1 FROM review_log l WHERE l.word_id=w.id AND (l.outcome IS NULL OR l.outcome IN ('first_correct','retry_correct','wrong')))
 ORDER BY p.last_review DESC,p.wrong DESC,w.id`).all();
 return BattlePool.preparePool(VocabularyHistory.policies(rows));
}
const ChapterEnding=require('./chapter-ending').createChapterEnding(db,Campaign,adventurePool,getDatabaseInstanceId);

const app = express();
app.use(express.json());
app.use(VocabularyHistory.guard);
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));
app.use(express.static(path.join(__dirname, '..', 'static')));
app.get('/api/desktop/mobile-export',(_req,res)=>{
 const file=require('./mobile-transfer').mobileExport(db);
 res.set({'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="moci-mobile-transfer.json"','Cache-Control':'no-store'}).send(file);
});
app.get('/api/desktop/runtime',(_req,res)=>{
 const info=require('./runtime-info').runtimeInfo(db);if(app.locals.contentUpgrade)info.contentUpgrade=app.locals.contentUpgrade;
 res.set('Cache-Control','no-store').json(info);
});
app.post('/api/desktop/content-update',async(_req,res)=>{
 const contentUpgrade=await refreshContentUpdate();
 res.status(contentUpgrade.status==='failed'?503:200).json({contentUpgrade,...(contentUpgrade.status==='failed'?{error:'词库更新未完成，已保留原有内容和学习记录。'}:{})});
});
app.get('/api/adventure/campaign',(req,res)=>{
 const state=Campaign.state(),ending=ChapterEnding.ending();
 res.set('Cache-Control','no-store').json({...state,completed:ending?14:state.completed,chapterCleared:!!ending,ending:ending?{title:ending.title,memorial:ending.memorial,completedAt:ending.completedAt}:null});
});
app.get('/api/adventure/ending',(req,res)=>res.set('Cache-Control','no-store').json({ending:ChapterEnding.ending()}));
app.post('/api/adventure/boss/sessions',(req,res)=>{
 try{res.status(201).json(ChapterEnding.start());}catch(e){res.status(409).json({error:e.message});}
});
app.get('/api/adventure/boss/sessions/:id',(req,res)=>{
 const session=ChapterEnding.session(req.params.id);res.set('Cache-Control','no-store');
 if(!session)return res.status(404).json({error:'挑战记录不存在'});res.json(session);
});
app.post('/api/adventure/boss/sessions/:id/finish',(req,res)=>{
 try{res.json(ChapterEnding.finish(req.params.id,req.body?.events));}catch(e){res.status(409).json({error:e.message});}
});
app.post('/api/adventure/campaign/complete-day',(req,res)=>{
  const bookId=Number(req.body?.book_id);if(!Number.isSafeInteger(bookId)||bookId<1)return res.status(400).json({error:'无效的词库 ID'});
  try{const result=Campaign.claim(bookId);res.status(result.ok?200:409).json(result);}catch(e){console.error('[campaign]',e.message);res.status(500).json({error:'旅程暂时无法保存，请重试'});}
});

// Read-only battle roster. Playing never changes progress, review dates or rewards.
app.get('/api/adventure/pool', (req, res) => {
  const words=adventurePool();
  res.set('Cache-Control','no-store').json({instanceId:getDatabaseInstanceId(),words,available:words.length,minimum:10});
});

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
    SELECT w.*, p.streak, p.correct, p.wrong, p.next_due, p.last_review, p.review_level, 0 AS is_new
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
  progress: db.prepare('SELECT streak, first_studied, next_due, review_level, wrong, correct FROM progress WHERE word_id = ?'),
  hasReviewForWord: db.prepare('SELECT 1 AS found FROM review_log WHERE word_id = ? LIMIT 1'),
  lastReviewForSession: db.prepare('SELECT outcome FROM review_log WHERE session_id = ? AND word_id = ? ORDER BY id DESC LIMIT 1'),
  upsertProgress: db.prepare(`
    INSERT INTO progress (word_id, correct, wrong, streak, last_review, next_due, first_studied, review_level)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'), coalesce(?,datetime('now', 'localtime', ?)), datetime('now', 'localtime'), ?)
    ON CONFLICT(word_id) DO UPDATE SET
      correct = correct + excluded.correct,
      wrong = wrong + excluded.wrong,
      streak = excluded.streak,
      last_review = excluded.last_review,
      next_due = excluded.next_due,
      review_level = excluded.review_level`),
  logReview: db.prepare('INSERT INTO review_log (word_id, correct, is_new, request_id, outcome, session_id, request_payload, practice_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  reviewByRequest: db.prepare('SELECT id, word_id, correct, outcome, request_payload FROM review_log WHERE request_id = ?'),
  mistakes: db.prepare(`
    SELECT w.*, b.name AS book_name, b.is_builtin AS book_is_builtin, p.wrong, p.streak, p.last_review, p.next_due, p.review_level
    FROM progress p JOIN words w ON w.id = p.word_id JOIN wordbooks b ON b.id = w.book_id
    WHERE p.wrong > 0 AND p.streak < 3 AND NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id)
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
  rewardWords: db.prepare(`SELECT COUNT(DISTINCT word_id) AS count FROM review_log
    WHERE date(ts) = date('now', 'localtime') AND correct = 1
      AND (outcome IS NULL OR outcome IN ('first_correct', 'retry_correct'))`),
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
  const memories=WordMemory.read(words.filter(word=>word.is_new===0||word.wrong!==undefined).map(word=>word.id));
  return VocabularyHistory.policies(words).map(word => {
    const presentation = Domain.sampleWordPresentation(word, book);
    return { ...word, ...presentation, memory: memories.get(word.id)||null };
  });
}

function wordMemory(id) {
  return WordMemory.one(id);
}

function presentMistakeWords(words) {
  const memories=WordMemory.read(words.map(word=>word.id));
  return VocabularyHistory.policies(words).map(({ book_is_builtin, ...word }) => {
    const presentation = Domain.sampleWordPresentation(word, {
      name: word.book_name,
      is_builtin: book_is_builtin,
    });
    return { ...word, ...presentation, memory: memories.get(word.id)||null };
  });
}

// ---- 学习计划：根据目标日期计算每日新词配额 ----
// 剩余新词数 ÷ 剩余天数 = 每天至少新学多少；复习由遗忘曲线自动排
function planFor(book) {
  const totalNew = db.prepare(`
    SELECT COUNT(*) AS c FROM words w LEFT JOIN progress p ON p.word_id = w.id
    WHERE w.book_id = ? AND p.word_id IS NULL`).get(book.id).c;
  const learnedToday = countNewToday(book.id);
  const plan = Domain.calculatePlan({
    remainingNew: totalNew + learnedToday,
    dailyNew: book.daily_new,
    planActive: Boolean(book.plan_active),
    targetDate: book.target_date,
    planMode: book.plan_mode,
  });
  return { ...plan, remaining_new: totalNew, ...(totalNew === 0 ? { status: 'completed' } : {}) };
}

function attachChoices(words) {
  for (const word of words) {
    // A self-built vocabulary often has fewer than four distinct definitions.
    // Never display a duplicate or a second correct answer: top up from other
    // vocabulary books only when the selected book is too small.
    const seen = new Set([LearningContext.choiceSummary(word.meaning).toLocaleLowerCase()]);
    const correctFragments = new Set(word.meaning.match(/[\u3400-\u9fff]{2,}/g) || []);
    const choices = [word.meaning];
    const addCandidates = rows => {
      for (const row of rows) {
        const text = row.meaning.trim();
        const key = LearningContext.choiceSummary(text).toLocaleLowerCase();
        if (!text || seen.has(key) || (text.match(/[\u3400-\u9fff]{2,}/g) || []).some(fragment => correctFragments.has(fragment))) continue;
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

app.get('/api/books/history', (req,res)=>{
 const books=q.books.all().filter(b=>VocabularyHistory.isHistory(b.id)).map(b=>({...b,read_only:true}));
 res.set('Cache-Control','no-store').json(books);
});
app.get('/api/books', (req, res) => {
  const books = q.books.all().map(b=>({...b,read_only:VocabularyHistory.isHistory(b.id)}))
    .filter(b=>req.query.include_history==='1'||!b.read_only);
  for (const b of books) {
    b.plan = planFor(b);
    if(!b.read_only)b.workload={...DailyWorkload.get(b,b.plan),review:undefined,recovery:undefined};
    if(!b.read_only)b.unfinished_count=unfinishedWords(db,b.id).length;
    const build = db.prepare('SELECT content_version,audit_json FROM vocabulary_builds WHERE book_id=?').get(b.id);
    if (build) {
      const audit = JSON.parse(build.audit_json);
      b.quality = { version: build.content_version, source: audit.file, pending: audit.excluded,
        content_status:audit.content_status||null,quality_counts:audit.quality_counts||null,
        unique_headwords: audit.unique_headwords,
        examples: db.prepare("SELECT COUNT(*) n FROM words WHERE book_id=? AND trim(example)<>'' AND trim(example_translation)<>''").get(b.id).n };
    }
  }
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
  const { target_date, mode = 'date', daily_new } = req.body || {};
  const id = Number(req.params.id);
  const book = db.prepare('SELECT * FROM wordbooks WHERE id = ?').get(id);
  if (!book) return res.status(404).json({ error: '词库不存在' });
  if (!['date', 'daily'].includes(mode)) return res.status(400).json({ error: '无效的计划方式' });
  if (mode === 'daily') {
    if (!Number.isSafeInteger(daily_new) || daily_new < 1 || daily_new > 50) return res.status(400).json({ error: '每日新词需为 1–50 的整数' });
    db.prepare("UPDATE wordbooks SET plan_mode='daily',daily_new=?,target_date=NULL,plan_active=1 WHERE id=?").run(daily_new, id);
    return res.json({ ok: true, plan: planFor({ ...book, daily_new, plan_mode: 'daily', plan_active: 1, target_date: null }) });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(target_date || '')) return res.status(400).json({ error: '目标日期格式应为 YYYY-MM-DD' });
  const target = new Date(target_date + 'T00:00:00');
  if (Domain.localDayKey(target) !== target_date) return res.status(400).json({ error: '目标日期不是有效日期' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (target < today) return res.status(400).json({ error: '目标日期不能早于今天' });
  const preview = planFor({ ...book, plan_active: 1, target_date, plan_mode: 'date' });
  if (Math.ceil(preview.remaining_new / preview.days_left) > 200) return res.status(400).json({ error: '目标过紧，每日需超过 200 个新词，请延后日期或选择每日词量。' });
  db.prepare("UPDATE wordbooks SET target_date=?,plan_active=1,plan_mode='date' WHERE id=?").run(target_date, id);
  res.json({ ok: true, plan: preview });
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
  const allowed = new Set(['all', 'new', 'due', 'mistakes', 'mastered','learned','yesterday','unfinished']);
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

  const unfinishedIds=new Set(['learned','yesterday','unfinished'].includes(status)?unfinishedWords(db,bookId).map(w=>w.id):[]);
  const filters = {
    all: '',
    new: ' AND p.word_id IS NULL',
    due: " AND p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')",
    mistakes: ' AND p.wrong > 0 AND p.streak < 3',
    mastered: ' AND p.streak >= 3',
    learned: ' AND p.first_studied IS NOT NULL',
    yesterday: " AND date(p.first_studied)=date('now','localtime','-1 day')",
    unfinished: ' AND w.id IN ('+([...unfinishedIds].join(',')||'NULL')+')',
  };
  // instr() handles literal percent/underscore without interpreting LIKE wildcards.
  const matchSql = keyword ? ' AND (instr(lower(w.word), lower(?)) > 0 OR instr(lower(w.meaning), lower(?)) > 0)' : '';
  const where = 'WHERE w.book_id = ?' + filters[status] + matchSql;
  const args = keyword ? [bookId, keyword, keyword] : [bookId];
  // Substring matches still need a scan; retain the book-local scan for search
  // rather than walking the new display-order index through every full row.
  const from = `FROM words w ${keyword ? 'INDEXED BY idx_words_book ' : ''}LEFT JOIN progress p ON p.word_id = w.id `;
  const total = db.prepare('SELECT COUNT(*) AS total ' + from + where).get(...args).total;
  const pages = Math.max(1, Math.ceil(total / requestedSize));
  const page = Math.min(requestedPage, pages);
  const rows = db.prepare(`SELECT w.*, p.streak, p.correct, p.wrong, p.next_due,p.first_studied
    ${from}${where} ORDER BY w.word COLLATE NOCASE, w.id LIMIT ? OFFSET ?`)
    .all(...args, requestedSize, (page - 1) * requestedSize);
  res.set('Cache-Control', 'no-store').json({
    items: presentWords(rows, book).map(w=>({...w,unfinished:unfinishedIds.has(w.id)})), total, page, page_size: requestedSize, pages,
    search: keyword, status,
  });
});

app.post('/api/words', (req, res) => {
  const { book_id, word, phonetic = '', pos = '', meaning, example = '' } = req.body || {};
  if (!book_id || typeof word !== 'string' || !word.trim() || typeof meaning !== 'string' || !meaning.trim()) return res.status(400).json({ error: '单词和释义必填' });
  try {
    const r = q.insertWord.run(book_id, word.trim(), phonetic.trim(), pos.trim(), meaning.trim(), example.trim());
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (e) {
    res.status(409).json({ error: '该单词已存在于此词库' });
  }
});

// 批量导入：{ book_id, text }，每行一个词，支持 "word [音标] 词性. 释义" / "word 词性. 释义" / "word<TAB>释义" / "word,释义"
function previewImport(bookId, text) {
  const seen = new Set(q.words.all(bookId).map(w => w.word));
  const entries = [], bad = []; let dup = 0;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const entry = parseImportLine(line);
    if (!entry) { bad.push({ line: index + 1, text: line.trim().slice(0, 120) }); continue; }
    if (seen.has(entry.word)) { dup++; continue; }
    seen.add(entry.word); entries.push(entry);
  }
  return { entries, dup, bad };
}

app.post('/api/books/:id/import/preview', (req, res) => {
  const bookId = Number(req.params.id), text = req.body?.text;
  if (!db.prepare('SELECT id FROM wordbooks WHERE id=?').get(bookId)) return res.status(404).json({ error: '词库不存在' });
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: '导入内容为空' });
  const preview = previewImport(bookId, text);
  res.json({ added: preview.entries.length, dup: preview.dup, bad: preview.bad.slice(0, 20), bad_total: preview.bad.length, sample: preview.entries.slice(0, 10) });
});

app.post('/api/books/:id/import', (req, res) => {
  const { text } = req.body || {};
  const bookId = Number(req.params.id);
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: '导入内容为空' });
  if (!db.prepare('SELECT id FROM wordbooks WHERE id = ?').get(bookId)) return res.status(404).json({ error: '词库不存在' });
  const preview = previewImport(bookId, text);
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const p of preview.entries) q.insertWord.run(bookId, p.word, p.phonetic, p.pos, p.meaning, '');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); return res.status(409).json({ error: '导入未完成，请重新预览后重试。' }); }
  res.json({ added: preview.entries.length, dup: preview.dup, bad: preview.bad.slice(0, 20).map(r => `第 ${r.line} 行：${r.text}`), bad_total: preview.bad.length });
});

app.put('/api/words/:id', (req, res) => {
  const { word, phonetic = '', pos = '', meaning, example = '' } = req.body || {};
  if (typeof word !== 'string' || !word.trim() || typeof meaning !== 'string' || !meaning.trim()) return res.status(400).json({ error: '单词和释义必填' });
  const original = db.prepare('SELECT word FROM words WHERE id=?').get(Number(req.params.id));
  const r = q.updateWord.run(word.trim(), phonetic.trim(), pos.trim(), meaning.trim(), example.trim(), Number(req.params.id));
  if (r.changes === 0) return res.status(404).json({ error: '单词不存在' });
  if (original.word !== word.trim()) db.prepare('UPDATE words SET headword=NULL,homograph=NULL WHERE id=?').run(Number(req.params.id));
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
    const fresh = q.newWords.all(bookId, limits.new_limit);
    attachChoices(fresh);
    return res.json(presentWords(fresh, book));
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
  res.json(presentWords(mode === 'pos' ? words.filter(Domain.isUnambiguousPos) : words, book));
});

app.get('/api/desktop/identity', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ instance_id: getDatabaseInstanceId() });
});

// The Desktop "Today" experience follows the real plan, not an arbitrary
// ten/twenty/forty-question limit. Review and new words are separate phases
// of a single guided task. Existing mobile study endpoints are unchanged.
app.get('/api/desktop/books/:id/choices', (req, res) => {
  const bookId = Number(req.params.id);
  const ids = String(req.query.ids || '').split(',').map(Number);
  if (!Number.isSafeInteger(bookId) || bookId < 1 || !ids.length || ids.length > 200
      || ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
    return res.status(400).json({error: '无效的单词清单'});
  }
  const words = db.prepare(`SELECT * FROM words WHERE book_id = ? AND id IN (${ids.map(() => '?').join(',')})`).all(bookId, ...ids);
  attachChoices(words);
  const book=db.prepare('SELECT * FROM wordbooks WHERE id=?').get(bookId);
  res.set('Cache-Control', 'no-store').json(presentWords(words,book).map(word=>({...word,memory:wordMemory(word.id)})));
});

app.get('/api/desktop/books/:id/today', (req, res) => {
  const bookId = Number(req.params.id);
  if (!Number.isSafeInteger(bookId) || bookId < 1) {
    return res.status(400).json({ error: '无效的词库 ID' });
  }
  const book = db.prepare('SELECT * FROM wordbooks WHERE id = ?').get(bookId);
  if (!book) return res.status(404).json({ error: '词库不存在' });
  const plan = planFor(book);
  if(req.query.unfinished==='1'){
    const pending=unfinishedWords(db,bookId),review=pending.slice(0,10);attachChoices(review);
    return res.set('Cache-Control','no-store').json({book_id:bookId,review:presentWords(review,book),learn:[],due_total:pending.length,unfinished_total:pending.length,new_remaining:0,review_has_more:pending.length>review.length,learn_has_more:false});
  }
  const workload=DailyWorkload.get(book,plan,true);
  const unfinished=unfinishedWords(db,bookId),pendingIds=new Set(unfinished.map(w=>w.id));
  const availableReview=[...workload.review,...workload.recovery];
  const due = availableReview.slice(0,10);
  const allReviewTotal=workload.due_total;
  const newRemaining = workload.new_remaining;
  const fresh = q.newWords.all(bookId, Math.min(200, newRemaining));
  attachChoices(due);
  attachChoices(fresh);
  res.set('Cache-Control', 'no-store').json({
    book_id: bookId,
    review: presentWords(due, book),
    learn: presentWords(fresh, book),
    due_total: allReviewTotal,
    unfinished_total: due.filter(w=>pendingIds.has(w.id)).length,
    workload:{...workload,review:undefined,recovery:undefined},
    new_remaining: newRemaining,
    review_has_more: availableReview.length > due.length,
    learn_has_more: newRemaining > fresh.length,
  });
});

function countNewToday(bookId) {
  return db.prepare(`
    SELECT COUNT(*) AS c FROM progress p JOIN words w ON w.id = p.word_id
    WHERE w.book_id = ? AND date(p.first_studied) = date('now', 'localtime')`).get(bookId).c;
}

// The existing no-query mistake endpoints remain global for Android.
// Desktop can request one book; other books must never leak into that view.
function getMistakeScope(req, res) {
  if (req.query.book_id === undefined) return { bookId: null, words: q.mistakes.all() };
  const bookId = Number(req.query.book_id);
  if (!Number.isSafeInteger(bookId) || bookId < 1) {
    res.status(400).json({ error: '无效的词库 ID' });
    return null;
  }
  if (!db.prepare('SELECT 1 FROM wordbooks WHERE id = ?').get(bookId)) {
    res.status(404).json({ error: '词库不存在' });
    return null;
  }
  return { bookId, words: q.mistakes.all().filter(word => word.book_id === bookId) };
}

// 错题本
app.get('/api/desktop/mistakes/count', (req,res)=>{
  const result=db.prepare(`SELECT COUNT(*) count FROM progress p
    JOIN words w ON w.id=p.word_id JOIN wordbooks b ON b.id=w.book_id
    WHERE p.wrong>0 AND p.streak<3 AND NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id)`).get();
  res.set('Cache-Control','no-store').json(result);
});
app.get('/api/mistakes', (req, res) => {
  const scope = getMistakeScope(req, res);
  if (!scope) return;
  res.set('Cache-Control', 'no-store').json(presentMistakeWords(scope.words));
});

app.get('/api/mistakes/study', (req, res) => {
  const scope = getMistakeScope(req, res);
  if (!scope) return;
  const words = presentMistakeWords(req.query.mode === 'pos' ? scope.words.filter(Domain.isUnambiguousPos) : scope.words).slice(0, 30);
  words.sort(() => Math.random() - 0.5);
  if (req.query.mode === 'meaning') attachChoices(words);
  res.set('Cache-Control', 'no-store').json(words);
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
  const practiceMode = ['spelling','meaning','pos'].includes(req.body.judgement_mode) ? req.body.judgement_mode : null;
  const cycleId=req.body.review_cycle;
  if(cycleId!==undefined&&(typeof cycleId!=='string'||cycleId.length<8||cycleId.length>128||!['meaning','spelling'].includes(practiceMode)))return res.status(400).json({error:'复习轮次无效'});
  let requestPayload = JSON.stringify({
    word_id: wordId,
    correct,
    is_new: isNewRequest,
    session_id,
    outcome,
    ...(practiceMode ? { practice_mode: practiceMode } : {}),
    ...(cycleId ? {review_cycle:cycleId} : {}),
  });

  db.exec('BEGIN IMMEDIATE');
  try {
    const policySource=db.prepare('SELECT * FROM words WHERE id=?').get(wordId);
    const policyWord=policySource&&VocabularyHistory.policies([policySource])[0];
    if(practiceMode==='spelling'&&policyWord?.answer_policy){
      if(outcome!=='abandoned'&&(typeof req.body.answer_value!=='string'||Domain.judgeAnswer('spelling',req.body.answer_value,policyWord)!==correct)){
        db.exec('ROLLBACK');return res.status(409).json({error:'拼写结果与审核规则不符，请重新作答。'});
      }
      requestPayload=JSON.stringify({...JSON.parse(requestPayload),answer_value:String(req.body.answer_value??'')});
    }
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
      return res.json({ ok: true, duplicate: true, streak: current ? current.streak : 0, outcome: priorRequest.outcome, memory: wordMemory(priorRequest.word_id) });
    }

    const exists = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId);
    if (!exists) {
      db.exec('ROLLBACK');
      return res.status(404).json({ error: '单词不存在' });
    }
    const current = q.progress.get(wordId);
    const streak = Domain.nextStreak(current ? current.streak : 0, correct);
    const schedule = cycleId ? ReviewCycle.record(db,exists,current,practiceMode,correct,cycleId).schedule : Domain.recallSchedule(current, correct);
    const hadReview = Boolean(q.hasReviewForWord.get(wordId));
    const firstStudiedToday = current?.first_studied && String(current.first_studied).slice(0, 10) === Domain.localDayKey();
    const newFlag = Boolean(is_new || firstStudiedToday) && !hadReview;
    const previousOutcome = q.lastReviewForSession.get(session_id, wordId)?.outcome;
    const savedOutcome = Domain.classifyOutcome(
      correct,
      ['wrong', 'abandoned', 'retry_correct'].includes(previousOutcome),
      outcome,
    );
    q.upsertProgress.run(wordId, correct ? 1 : 0, correct ? 0 : 1, streak, schedule.preserveDue, schedule.modifier, schedule.level);
    q.logReview.run(wordId, correct ? 1 : 0, newFlag ? 1 : 0, request_id, savedOutcome, session_id, requestPayload, practiceMode);
    db.exec('COMMIT');
    return res.json({ ok: true, duplicate: false, streak, outcome: savedOutcome, memory: wordMemory(wordId) });
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
    rewardWords: q.rewardWords.get().count,
  }));
});

// Desktop-only, read-only learning diagnosis. All numbers have an explicit
// time range and optional single-book scope. This does not change SRS scheduling.
app.get('/api/desktop/insights', (req, res) => {
  const scoped = req.query.book_id !== undefined;
  const bookId = scoped ? Number(req.query.book_id) : null;
  if (scoped && (!Number.isSafeInteger(bookId) || bookId < 1)) {
    return res.status(400).json({ error: '无效的词库 ID' });
  }
  const book = scoped ? db.prepare('SELECT id, name FROM wordbooks WHERE id = ?').get(bookId) : null;
  if (scoped && !book) return res.status(404).json({ error: '词库不存在' });

  const args = scoped ? [bookId] : [];
  const wordFilter = scoped ? 'WHERE w.book_id = ?' : '';
  // Use exactly the same per-book daily plan math as the Today page.
  // "Unseen words" is a library fact, not permission to exceed today's quota.
  const relevantBooks = scoped ? q.books.all().filter(item => item.id === bookId) : q.books.all();
  const todayNewRemaining = relevantBooks.reduce((sum, item) => {
    const plan = planFor(item);
    return sum + Math.min(plan.remaining_new, Math.max(0, plan.daily_quota - item.new_today));
  }, 0);
  const counts = db.prepare(`
    SELECT COUNT(*) AS total_words, COUNT(p.word_id) AS started_words,
      COALESCE(SUM(CASE WHEN p.streak >= 3 THEN 1 ELSE 0 END), 0) AS mastered_words,
      COALESCE(SUM(CASE WHEN p.next_due IS NOT NULL
        AND p.next_due <= datetime('now', 'localtime') THEN 1 ELSE 0 END), 0) AS due_words,
      COALESCE(SUM(CASE WHEN p.wrong > 0 AND p.streak < 3 THEN 1 ELSE 0 END), 0) AS mistake_words
    FROM words w LEFT JOIN progress p ON p.word_id = w.id ${wordFilter}`).get(...args);

  const period = (from, to) => db.prepare(`
    SELECT COUNT(*) AS attempts, COALESCE(SUM(CASE WHEN l.correct = 1 THEN 1 ELSE 0 END), 0) AS correct
    FROM review_log l JOIN words w ON w.id = l.word_id
    WHERE date(l.ts) BETWEEN date('now', 'localtime', ?) AND date('now', 'localtime', ?)
    ${scoped ? 'AND w.book_id = ?' : ''}`).get(from, to, ...args);
  const recent = period('-6 days', '0 days');
  const previous = period('-13 days', '-7 days');

  const candidates = db.prepare(`
    SELECT w.id, w.book_id, w.word, w.meaning, b.name AS book_name,
      p.wrong, p.streak,
      CASE WHEN p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')
        THEN 1 ELSE 0 END AS due_now
    FROM progress p JOIN words w ON w.id = p.word_id
    JOIN wordbooks b ON b.id = w.book_id
    WHERE NOT EXISTS(SELECT 1 FROM book_history h WHERE h.book_id=b.id)
      AND (p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')
      OR (p.wrong > 0 AND p.streak < 3))
      ${scoped ? 'AND w.book_id = ?' : ''}
    ORDER BY
      CASE WHEN p.next_due IS NOT NULL AND p.next_due <= datetime('now', 'localtime')
        THEN 1 ELSE 0 END DESC,
      p.wrong DESC, p.streak ASC, w.id ASC LIMIT 5`).all(...args);

  res.set('Cache-Control', 'no-store').json(LearningInsights.buildInsights({
    scope: scoped ? 'book' : 'all', bookId,
    bookName: book?.name, counts: { ...counts, today_new_remaining: todayNewRemaining },
    recent, previous, candidates,
  }));
});

// ---- 学习数据统计 ----
app.get('/api/desktop/activity', (req,res) => {
  const days = Number(req.query.days || 90);
  const id = req.query.book_id === undefined ? null : Number(req.query.book_id);
  if (!Number.isInteger(days) || days<1 || days>90 || (id!==null && (!Number.isSafeInteger(id) || id<1))) return res.status(400).json({error:'无效的统计范围'});
  if (id!==null && !db.prepare('SELECT 1 FROM wordbooks WHERE id=?').get(id)) return res.status(404).json({error:'词库不存在'});
  const since = `-${days-1} days`;
  const filter = id === null ? '' : ' AND w.book_id=?';
  const args = id===null ? [since,since] : [since,id,since,id];
  const rows = db.prepare(`SELECT day,SUM(total) total,SUM(correct) correct,SUM(new_words) new_words FROM (
    SELECT date(l.ts) day,COUNT(*) total,SUM(l.correct) correct,0 new_words FROM review_log l JOIN words w ON w.id=l.word_id
    WHERE date(l.ts)>=date('now','localtime',?) AND date(l.ts)<=date('now','localtime') ${filter} GROUP BY date(l.ts)
    UNION ALL
    SELECT date(p.first_studied) day,0 total,0 correct,COUNT(*) new_words FROM progress p JOIN words w ON w.id=p.word_id
    WHERE date(p.first_studied)>=date('now','localtime',?) AND date(p.first_studied)<=date('now','localtime') ${filter} GROUP BY date(p.first_studied)
  ) GROUP BY day ORDER BY day`).all(...args);
  res.set('Cache-Control','no-store').json(rows);
});
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
  const actionableBooks=books.filter(item=>!VocabularyHistory.isHistory(item.id));
  if (scoped && !book) return res.status(404).json({ error: '词库不存在' });
  const days = (scoped ? db.prepare(`SELECT DISTINCT date(l.ts) AS day FROM review_log l
    JOIN words w ON w.id = l.word_id WHERE w.book_id = ? ORDER BY day DESC`).all(bookId)
    : q.activeDays.all()).map(row => row.day);
  let streak = 0;
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  if (!days.includes(Domain.localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.includes(Domain.localDayKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }

  const today = scoped && VocabularyHistory.isHistory(bookId) ? {
    due_review:0,new_today:book.new_today,daily_new_quota:null,historical_read_only:true,
  } : scoped ? {
    due_review: book.due_review,
    new_today: book.new_today,
    // The quota can become zero *after* the last new word is introduced.
    // Preserve today's already completed target (10/10, never 10/0).
    daily_new_quota: Math.max(book.new_today,
      Math.min(planFor(book).daily_quota, book.new_today + planFor(book).remaining_new)),
  } : {
    due_review: actionableBooks.reduce((sum, item) => sum + item.due_review, 0),
    new_today: books.reduce((sum, item) => sum + item.new_today, 0),
    daily_new_quota: req.query.scope === 'all' ? null
      : actionableBooks.reduce((sum, item) => sum + planFor(item).daily_quota, 0),
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
    reward_words: q.rewardWords.get().count,
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
    if (!Domain.qualifiesForCard(q.rewardWords.get().count)) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: '今天答对 10 个不同词条后可领取卡牌；错后答对也计入，重复答对同一词只计一次' });
    }

    const mine = new Set(q.myCards.all().map(c => c.card_id));
    const pool = q.allCards.all().filter(c => !c.hidden && !mine.has(c.id));
    const card = Domain.pickWeightedCard(pool, Math.random());
    if (!card) {
      const normals = q.allCards.all().filter(c => !c.hidden);
      const sample = normals[Math.floor(Math.random() * normals.length)] || null;
      q.claimCard.run(Domain.localDayKey(), null);
      db.exec('COMMIT');
      return res.json({ card: null, duplicate: true, message: '普通卡已全部集齐，感谢你一路积累！', sample });
    }

    q.drawCard.run(card.id);
    const owned = mine.size + 1;
    const normalOwned = q.allCards.all().filter(c => !c.hidden && (mine.has(c.id) || c.id === card.id)).length;
    const unlocked = q.allCards.all().filter(c => c.hidden && !mine.has(c.id) && normalOwned >= c.unlock_at);
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

let contentUpdatePromise=null;
async function refreshContentUpdate(){
  if(contentUpdatePromise)return contentUpdatePromise;
  contentUpdatePromise=(async()=>{
  try{
    const databasePath=path.resolve(process.env.WORDMASTER_DB_PATH||path.join(__dirname,'../data/wordmaster.db'));
    const replacement=await require('./gaokao-replacement').replaceZhongkao(db,{databasePath,install:installBookContent});
    const update=await require('./content-upgrade').upgradeContent(db,{databasePath});
    app.locals.contentUpgrade={status:update.status,version:update.version,counts:update.counts,editedRowsPreserved:update.edited_rows_preserved||0,skippedBooks:update.skipped?.length||0,receiptSaved:update.receipt_saved??null,gaokaoReplacement:replacement.status};
  }catch(error){
    app.locals.contentUpgrade={status:'failed',version:require('./vocabulary').VERSION,originalContentRetained:true};
    console.error('[content] 词库内容更新未完成，继续使用原有内容。',error.message);
  }
  return app.locals.contentUpgrade;
  })();
  try{return await contentUpdatePromise;}finally{contentUpdatePromise=null;}
}
async function startDesktopServer({port=process.env.PORT||3456,host=process.env.WORDMASTER_HOST||'127.0.0.1'}={}) {
  seed();
  await refreshContentUpdate();
  return new Promise((resolve,reject)=>{
    const server=app.listen(port,host,()=>{console.log(`WordMaster 已启动: http://${host}:${server.address().port}`);resolve(server);});
    server.once('error',reject);
  });
}
if (require.main === module) startDesktopServer().catch(error=>{console.error('WordMaster 启动失败:',error.message);process.exitCode=1;});

module.exports = { app, db, startDesktopServer };
