'use strict';

// Transparent, read-only study insights. This is *not* a learning scheduler or
// an AI prediction: every label comes from counts in the local SQLite database.
function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function accuracy(row) {
  const attempts = count(row?.attempts);
  const correct = Math.min(attempts, count(row?.correct));
  return {
    attempts, correct,
    percentage: attempts ? Math.round(correct / attempts * 100) : null,
  };
}

function explainWord(word) {
  const wrong = count(word.wrong);
  const due = Boolean(word.due_now);
  const label = due && wrong > 0 ? '到期且曾答错'
    : due ? '已到期需要复习'
      : wrong >= 3 ? '累计答错较多' : '曾经答错，尚需巩固';
  return {
    id: Number(word.id),
    book_id: Number(word.book_id),
    book_name: String(word.book_name || ''),
    word: String(word.word || ''),
    meaning: String(word.meaning || ''),
    wrong, streak: count(word.streak),
    due_now: due,
    reason: label,
  };
}

function recommend({ scope, bookId, dueWords, mistakeWords, unseenWords, newWordsToday, startedWords, recent }) {
  const scoped = scope === 'book' && Number.isSafeInteger(Number(bookId));
  if (dueWords) {
    return {
      kind: 'due', title: `先把 ${dueWords} 个到期词复习掉`,
      explanation: '这些词已经到了原定复习时间，先巩固旧知识，再学习新词。',
      action: scoped ? 'today' : 'choose_book',
      button: scoped ? '开始当前词库的今日任务 →' : '回到今日选择词库 →',
    };
  }
  if (mistakeWords) {
    return {
      kind: 'mistakes', title: `有 ${mistakeWords} 个易错词值得回看`,
      explanation: '它们曾经答错，且还没有达到当前系统的掌握标准。不改变原定复习日期。',
      action: 'mistakes',
      button: scoped ? '查看当前词库错题 →' : '前往错题本（全部词库） →',
    };
  }
  if (newWordsToday) {
    return {
      kind: 'new', title: `今天还可学习 ${newWordsToday} 个新词`,
      explanation: '这里只计算本日学习计划允许的新词数量，剩余未学词数不会直接变成今天的任务。',
      action: scoped ? 'today' : 'choose_book',
      button: scoped ? '开始当前词库的今日任务 →' : '回到今日选择词库 →',
    };
  }
  if (unseenWords) {
    return {
      kind: 'plan_done', title: '今天没有需要继续的新词任务',
      explanation: `词库中仍有 ${unseenWords} 个未开始的词，但今天的配额已完成或当前学习计划未安排新词。下一步按计划继续。`,
      action: 'choose_book', button: '返回今日查看计划 →',
    };
  }
  if (startedWords) {
    return {
      kind: 'steady',
      title: '当前没有待处理的学习任务',
      explanation: recent.attempts
        ? '没有到期复习、待回炉错题或未开始的新词。后续任务仍按原定时间出现。'
        : '虽然最近 7 天未作答，但已有历史学习记录。下一次复习仍按原定到期日安排。',
      action: 'choose_book', button: '回到今日 →',
    };
  }
  return {
    kind: 'empty',
    title: '先给词库添上第一批单词',
    explanation: '当前范围还没有单词记录。导入或创建词库后，这里才会出现真实学习诊断。',
    action: 'books',
    button: '去词库管理 →',
  };
}

function buildInsights({
  scope = 'all', bookId = null, bookName = null,
  counts = {}, recent = {}, previous = {}, candidates = [],
} = {}) {
  if (!['all', 'book'].includes(scope)) throw new TypeError('scope must be all or book');
  const started = count(counts.started_words);
  const total = count(counts.total_words);
  const mastered = count(counts.mastered_words);
  const dueWords = count(counts.due_words);
  const mistakeWords = count(counts.mistake_words);
  const unseen = Math.max(0, total - started);
  const newWordsToday = Math.min(unseen, count(counts.today_new_remaining));
  const now = accuracy(recent);
  const before = accuracy(previous);
  const pct = total ? Math.min(100, Math.round(started / total * 100)) : 0;
  return {
    scope, book_id: scope === 'book' ? Number(bookId) : null,
    book_name: scope === 'book' ? String(bookName || '') : null,
    coverage: {
      total_words: total, started_words: started, unseen_words: unseen,
      mastered_words: mastered, started_percent: pct,
    },
    review: { due_words: dueWords, mistake_words: mistakeWords },
    today: { new_words_remaining: newWordsToday },
    last7: now,
    previous7: before,
    change_points: now.percentage === null || before.percentage === null
      ? null : now.percentage - before.percentage,
    focus_words: candidates.slice(0, 5).map(explainWord),
    recommendation: recommend({
      scope, bookId, dueWords, mistakeWords, unseenWords: unseen,
      newWordsToday, startedWords: started, recent: now,
    }),
    disclaimer: '基于本机真实学习记录的规则建议；掌握数与新词覆盖率不同，不预测记忆概率。',
  };
}

module.exports = { buildInsights, accuracy };
