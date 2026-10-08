'use strict';

(function exposeDomain(root, factory) {
  const domain = factory();
  if (typeof module === 'object' && module.exports) module.exports = domain;
  else root.WordMasterDomain = domain;
})(typeof globalThis === 'undefined' ? this : globalThis, function createDomain() {
  const REVIEW_INTERVALS_DAYS = [1, 2, 4, 7, 15, 30];
  const CARD_DRAW_TARGET = 10;
  const CARD_RARITY_WEIGHTS = Object.freeze({ N: 50, R: 30, SR: 15, UR: 5 });
  const POS_OPTIONS = Object.freeze(['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'art.']);
  const SPELLING_WORD_PATTERN = /^[a-z]+(?:[-'][a-z]+)*(?: [a-z]+(?:[-'][a-z]+)*)*$/;

  // First review sample only: exact, audited built-in rows. User vocabularies and
  // unverified rows keep their original spelling and meaning unchanged.
  const SAMPLE_BOOKS = new Set(['六级核心词汇', '英语专四专八词汇']);
  const SAMPLE_PRESENTATIONS = {
    'attribute 1': {
      headword: 'attribute', homograph: 1,
      phonetic: 'əˈtrɪbjʊːt', pos: 'v.', meaning: '把…归因于  || attribute to把…归于',
      groups: [{ heading: 'v.', items: ['把…归因于'] }],
      notes: [{ heading: '搭配', text: 'attribute to — 把…归于' }],
    },
    'attribute 2': {
      headword: 'attribute', homograph: 2,
      phonetic: 'ˈætrɪbjʊːt', pos: 'n.', meaning: '1. 性质，属性，特质 2. 人(地位)的象征(标志)',
      groups: [{ heading: 'n.', items: ['性质，属性，特质', '人(地位)的象征(标志)'] }],
      notes: [],
    },
    'cardinal 1': {
      headword: 'cardinal', homograph: 1,
      phonetic: 'ˈkɑːdɪnəl', pos: 'adj.', meaning: '1. 主要的，基本的 2. 深红的 n. 1. 深红色 2. 基数',
      groups: [
        { heading: 'adj.', items: ['主要的，基本的', '深红的'] },
        { heading: 'n.', items: ['深红色', '基数'] },
      ],
      notes: [],
    },
    'cardinal 2': {
      headword: 'cardinal', homograph: 2,
      phonetic: 'ˈkɑːdɪnəl', pos: 'n.', meaning: '红衣主教',
      groups: [{ heading: 'n.', items: ['红衣主教'] }],
      notes: [],
    },
  };

  function normalizeSpelling(value) {
    return String(value ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function isSpellableWord(value) {
    return SPELLING_WORD_PATTERN.test(normalizeSpelling(value));
  }

  function spellingWords(words) {
    return Array.isArray(words) ? words.filter(word => isSpellableWord(word?.answer_word || word?.word)) : [];
  }

  function sampleWordPresentation(word, book) {
    if (!word || !book?.is_builtin || !SAMPLE_BOOKS.has(book.name)) return null;
    const sample = SAMPLE_PRESENTATIONS[word.word];
    if (!sample || word.phonetic !== sample.phonetic || word.pos !== sample.pos || word.meaning !== sample.meaning) return null;
    return {
      display_word: sample.headword,
      answer_word: sample.headword,
      sense_label: `同形词 ${sample.homograph === 1 ? 'I' : 'II'}`,
      phonetic_display: `/${word.phonetic}/`,
      meaning_groups: sample.groups.map(group => ({ heading: group.heading, items: group.items.slice() })),
      meaning_notes: sample.notes.map(note => ({ ...note })),
    };
  }

  function filterSpellingInput(value, maxLength = Infinity) {
    const limit = Number.isFinite(Number(maxLength)) ? Math.max(0, Math.trunc(Number(maxLength))) : Infinity;
    return String(value ?? '').toLowerCase()
      .replace(/[^a-z\s'-]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, limit);
  }

  function normalizeSpellingAnswer(value) {
    return filterSpellingInput(value).trim();
  }

  function normalizePartOfSpeech(value) {
    const pos = String(value ?? '').toLowerCase().replace(/\s/g, '');
    if (/^v[ti]?\./.test(pos)) return 'v.';
    if (/^(a\.|adj\.)/.test(pos)) return 'adj.';
    if (/^(ad\.|adv\.)/.test(pos)) return 'adv.';
    if (/^n\./.test(pos)) return 'n.';
    if (/^prep/.test(pos)) return 'prep.';
    if (/^conj/.test(pos)) return 'conj.';
    if (/^pron/.test(pos)) return 'pron.';
    if (/^art/.test(pos)) return 'art.';
    return null;
  }

  function judgeAnswer(mode, submitted, word) {
    if (!word) return null;
    if (mode === 'spelling') {
      const expected = word.answer_word || word.word;
      return Boolean(expected) && normalizeSpellingAnswer(submitted) === normalizeSpelling(expected);
    }
    if (mode === 'meaning') return String(submitted ?? '') === String(word.meaning ?? '');
    if (mode === 'pos') {
      const expected = normalizePartOfSpeech(word.pos);
      const actual = normalizePartOfSpeech(submitted);
      return expected !== null && actual !== null && expected === actual;
    }
    return null;
  }

  function cardWeight(rarity) {
    return CARD_RARITY_WEIGHTS[rarity] || 10;
  }

  function pickWeightedCard(cards, randomValue = Math.random()) {
    if (!Array.isArray(cards) || !cards.length) return null;
    const totalWeight = cards.reduce((sum, card) => sum + cardWeight(card?.rarity), 0);
    if (!totalWeight) return null;
    const random = Number.isFinite(Number(randomValue))
      ? Math.min(1 - Number.EPSILON, Math.max(0, Number(randomValue)))
      : 0;
    const target = random * totalWeight;
    let cumulative = 0;
    for (const card of cards) {
      cumulative += cardWeight(card?.rarity);
      if (target < cumulative) return card;
    }
    return cards[cards.length - 1];
  }

  function asValidDate(value, label = 'date') {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new TypeError(`${label} must be a valid date`);
    return date;
  }

  function localDayKey(value = new Date()) {
    const date = asValidDate(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function parseCalendarDay(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  function inclusiveDaysUntil(targetDay, now = new Date()) {
    const target = parseCalendarDay(targetDay);
    if (!target) throw new TypeError('targetDay must be a valid YYYY-MM-DD date');
    const today = asValidDate(now, 'now');
    const targetOrdinal = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    const todayOrdinal = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.max(1, Math.floor((targetOrdinal - todayOrdinal) / 86400000) + 1);
  }

  function calculatePlan({ remainingNew, dailyNew = 15, planActive = false, targetDate = null, now = new Date() }) {
    const remaining = Math.max(0, Math.trunc(Number(remainingNew) || 0));
    if (!planActive || !targetDate) {
      return {
        active: false,
        remaining_new: remaining,
        daily_quota: Math.min(Math.max(0, Math.trunc(Number(dailyNew) || 0)), 50),
        days_left: null,
      };
    }

    const daysLeft = inclusiveDaysUntil(targetDate, now);
    return {
      active: true,
      remaining_new: remaining,
      daily_quota: Math.min(Math.ceil(remaining / daysLeft), 200),
      days_left: daysLeft,
      target_date: targetDate,
    };
  }

  function calculateDailyQuota({ remainingNew, dailyNew = 15, planActive = false, daysLeft = 1 }) {
    const remaining = Math.max(0, Math.trunc(Number(remainingNew) || 0));
    if (!planActive) return Math.min(Math.max(0, Math.trunc(Number(dailyNew) || 0)), 50);
    const days = Math.max(1, Math.trunc(Number(daysLeft) || 1));
    return Math.min(Math.ceil(remaining / days), 200);
  }

  function calculateStudyQueueLimits({ mode, dailyQuota, newToday = 0, wantAll = false, requestedLimit = 0 }) {
    const availableNew = Math.max(0, Math.trunc(Number(dailyQuota) || 0) - Math.max(0, Math.trunc(Number(newToday) || 0)));
    if (mode === 'learn') {
      const requested = Number(requestedLimit);
      const limit = !wantAll && Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), 50) : 50;
      return { due_limit: 0, new_limit: wantAll ? 50 : Math.min(availableNew, limit) };
    }
    return {
      due_limit: wantAll ? 100 : 200,
      new_limit: wantAll ? 0 : Math.min(availableNew, 100),
    };
  }

  function composeStudyQueue(dueWords, newWords, limits = {}) {
    const dueLimit = Math.max(0, Math.trunc(Number(limits.due_limit) || 0));
    const newLimit = Math.max(0, Math.trunc(Number(limits.new_limit) || 0));
    return [
      ...(Array.isArray(dueWords) ? dueWords.slice(0, dueLimit) : []),
      ...(Array.isArray(newWords) ? newWords.slice(0, newLimit) : []),
    ];
  }

  function nextScheduleDays(streak) {
    const index = Math.min(Math.max(Math.trunc(Number(streak) - 1) || 0, 0), REVIEW_INTERVALS_DAYS.length - 1);
    return REVIEW_INTERVALS_DAYS[index];
  }

  function nextDueModifier(correct, streak) {
    return correct ? `+${nextScheduleDays(streak)} days` : '+10 minutes';
  }

  function nextStreak(currentStreak, correct) {
    return correct ? Math.max(0, Math.trunc(Number(currentStreak) || 0) + 1) : 0;
  }

  function classifyOutcome(correct, isRetry, requestedOutcome) {
    if (correct) return isRetry ? 'retry_correct' : 'first_correct';
    if (requestedOutcome !== 'wrong' && requestedOutcome !== 'abandoned') {
      throw new TypeError('incorrect attempts must be wrong or abandoned');
    }
    return requestedOutcome;
  }

  function progressPercent(done, total) {
    const count = Math.max(0, Number(done) || 0);
    const whole = Math.max(0, Number(total) || 0);
    return whole ? Math.min(100, Math.round((count / whole) * 100)) : 0;
  }

  function buildAccuracyTimeline(daily, range = 30, now = new Date()) {
    const count = Math.min(365, Math.max(1, Math.trunc(Number(range) || 30)));
    const today = asValidDate(now, 'now');
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - count + 1);
    const calendarDays = [];
    const cursor = new Date(start);
    for (let i = 0; i < count; i++) {
      calendarDays.push(localDayKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const rows = new Map();
    for (const row of Array.isArray(daily) ? daily : []) {
      if (!calendarDays.includes(row?.day)) continue;
      const total = Math.max(0, Math.trunc(Number(row.total) || 0));
      const correct = Math.min(total, Math.max(0, Math.trunc(Number(row.correct) || 0)));
      if (!total) continue;
      const current = rows.get(row.day) || { total: 0, correct: 0 };
      current.total += total;
      current.correct += correct;
      rows.set(row.day, current);
    }
    const points = calendarDays.flatMap((day, index) => {
      const row = rows.get(day);
      return row ? [{ day, index, total: row.total, correct: row.correct, accuracy: Math.round(row.correct / row.total * 100) }] : [];
    });

    const segments = [];
    if (points.length >= 4) {
      let current = [];
      for (const point of points) {
        if (current.length && point.index !== current[current.length - 1].index + 1) {
          if (current.length > 1) segments.push(current);
          current = [];
        }
        current.push(point);
      }
      if (current.length > 1) segments.push(current);
    }
    return { calendarDays, points, segments };
  }

  function accuracyDisplayMode(timeline) {
    const points = Array.isArray(timeline?.points) ? timeline.points : [];
    if (!points.length) return 'empty';
    if (points.length < 7) return 'records';
    const span = points[points.length - 1].index - points[0].index + 1;
    const density = points.length / Math.max(1, span);
    const largestGap = points.reduce((largest, point, index) => {
      if (!index) return largest;
      return Math.max(largest, point.index - points[index - 1].index - 1);
    }, 0);
    return largestGap > 6 || density < 0.4 ? 'records' : 'trend';
  }

  function recordLearnChoice(completedWordIds, wordId, needsReview) {
    if (!(completedWordIds instanceof Set)) throw new TypeError('completedWordIds must be a Set');
    if (!needsReview) completedWordIds.add(String(wordId));
    return { completedCount: completedWordIds.size, requeue: Boolean(needsReview) };
  }

  function qualifiesForCard(answered, target = CARD_DRAW_TARGET) {
    return Number(answered) >= Number(target);
  }

  return {
    CARD_DRAW_TARGET,
    CARD_RARITY_WEIGHTS,
    POS_OPTIONS,
    REVIEW_INTERVALS_DAYS,
    accuracyDisplayMode,
    buildAccuracyTimeline,
    calculatePlan,
    calculateDailyQuota,
    calculateStudyQueueLimits,
    composeStudyQueue,
    classifyOutcome,
    filterSpellingInput,
    isSpellableWord,
    judgeAnswer,
    inclusiveDaysUntil,
    localDayKey,
    normalizeSpelling,
    normalizeSpellingAnswer,
    normalizePartOfSpeech,
    nextDueModifier,
    nextScheduleDays,
    nextStreak,
    progressPercent,
    qualifiesForCard,
    cardWeight,
    pickWeightedCard,
    recordLearnChoice,
    sampleWordPresentation,
    spellingWords,
  };
});
