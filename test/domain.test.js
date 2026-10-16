'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Domain = require('../shared/domain');

const androidG1Fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'android-g1-rules.json'), 'utf8'));

test('review intervals preserve the 1, 2, 4, 7, 15, 30 day schedule', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(Domain.nextScheduleDays), [1, 2, 4, 7, 15, 30, 30]);
  assert.equal(Domain.nextDueModifier(false, 0), '+10 minutes');
  assert.equal(Domain.nextStreak(5, false), 0);
  assert.equal(Domain.nextStreak(5, true), 6);
});

test('plan quotas use inclusive local calendar days and retain the caps', () => {
  const now = new Date(2026, 8, 27, 23, 55);
  assert.equal(Domain.inclusiveDaysUntil('2026-09-27', now), 1);
  assert.equal(Domain.inclusiveDaysUntil('2026-10-03', now), 7);
  assert.deepEqual(Domain.calculatePlan({ remainingNew: 21, dailyNew: 15, planActive: true, targetDate: '2026-10-03', now }), {
    active: true, remaining_new: 21, daily_quota: 3, days_left: 7, target_date: '2026-10-03',
  });
  assert.equal(Domain.calculatePlan({ remainingNew: 100, dailyNew: 75 }).daily_quota, 50);
  const overdue = Domain.calculatePlan({ remainingNew: 1000, planActive: true, targetDate: '2026-09-26', now });
  assert.equal(overdue.daily_quota, 15);
  assert.equal(overdue.status, 'overdue');
  assert.equal(overdue.days_left, 0);
  assert.equal(overdue.overdue_days, 1);
  assert.throws(() => Domain.inclusiveDaysUntil('2026-02-30', now), /valid YYYY-MM-DD/);
});

test('local day keys change at the local midnight boundary', () => {
  const beforeMidnight = new Date(2026, 8, 26, 23, 59, 59, 999);
  const afterMidnight = new Date(2026, 8, 27, 0, 0, 0, 0);
  assert.equal(Domain.localDayKey(beforeMidnight), '2026-09-26');
  assert.equal(Domain.localDayKey(afterMidnight), '2026-09-27');
});

test('study outcomes, progress display, and card eligibility use explicit boundaries', () => {
  assert.equal(Domain.classifyOutcome(true, false), 'first_correct');
  assert.equal(Domain.classifyOutcome(true, true), 'retry_correct');
  assert.equal(Domain.classifyOutcome(false, false, 'wrong'), 'wrong');
  assert.equal(Domain.classifyOutcome(false, true, 'abandoned'), 'abandoned');
  assert.equal(Domain.progressPercent(14, 10), 100);
  assert.equal(Domain.progressPercent(4, 10), 40);
  assert.equal(Domain.qualifiesForCard(9), false);
  assert.equal(Domain.qualifiesForCard(10), true);
});

test('shared practice judges cover spelling, meaning, and normalized part of speech', () => {
  const word = { word: "mother-in-law", meaning: '岳母；婆婆', pos: 'vt./vi.' };
  assert.equal(Domain.judgeAnswer('spelling', ' MOTHER-IN-LAW ', word), true);
  assert.equal(Domain.judgeAnswer('spelling', 'mother in law', word), false);
  assert.equal(Domain.judgeAnswer('meaning', '岳母；婆婆', word), true);
  assert.equal(Domain.judgeAnswer('meaning', '岳母', word), false);
  assert.equal(Domain.judgeAnswer('pos', 'v.', word), true);
  assert.equal(Domain.judgeAnswer('pos', 'adj.', word), false);
  assert.equal(Domain.judgeAnswer('phonetics', 'v.', word), null);
  assert.equal(Domain.normalizePartOfSpeech('a.'), 'adj.');
  assert.equal(Domain.normalizePartOfSpeech('ad.'), 'adv.');
  assert.equal(Domain.normalizePartOfSpeech('unclassified'), null);
});

test('weighted card choice preserves rarity buckets at deterministic boundaries', () => {
  const cards = [
    { id: 1, rarity: 'N' },
    { id: 2, rarity: 'R' },
    { id: 3, rarity: 'SR' },
    { id: 4, rarity: 'UR' },
  ];
  assert.deepEqual(cards.map(card => Domain.cardWeight(card.rarity)), [50, 30, 15, 5]);
  assert.equal(Domain.pickWeightedCard(cards, 0).id, 1);
  assert.equal(Domain.pickWeightedCard(cards, 0.5).id, 2);
  assert.equal(Domain.pickWeightedCard(cards, 0.8).id, 3);
  assert.equal(Domain.pickWeightedCard(cards, 0.95).id, 4);
  assert.equal(Domain.pickWeightedCard(cards, 1).id, 4);
  assert.equal(Domain.pickWeightedCard([], 0.5), null);
});

test('shared G1 fixture fixes Web/Android judgment, quota, queue, retry, and draw boundaries', () => {
  for (const sample of androidG1Fixture.judgements) {
    const judged = Domain.judgeAnswer(sample.mode, sample.submitted, sample);
    assert.equal(judged, sample.expected, `${sample.mode} judgment for ${sample.submitted}`);
  }
  for (const sample of androidG1Fixture.outcomes) {
    assert.equal(Domain.classifyOutcome(sample.correct, sample.retry, sample.requested), sample.expected);
  }
  assert.deepEqual(androidG1Fixture.review_intervals.map((_, i) => Domain.nextScheduleDays(i + 1)), androidG1Fixture.review_intervals);

  const plan = androidG1Fixture.plans;
  assert.equal(Domain.calculateDailyQuota({ remainingNew: plan.remaining_new, planActive: true, daysLeft: plan.days_left }), plan.active_quota);
  assert.equal(Domain.calculateDailyQuota({ remainingNew: plan.remaining_new, dailyNew: plan.inactive_daily_new }), plan.inactive_quota);

  const queues = androidG1Fixture.queues;
  const limits = Domain.calculateStudyQueueLimits({ mode: 'spelling', dailyQuota: queues.daily_quota, newToday: queues.new_today });
  assert.equal(limits.due_limit, queues.expected_due_limit);
  assert.equal(limits.new_limit, queues.expected_new_limit);
  assert.deepEqual(Domain.composeStudyQueue(queues.due, queues.fresh, limits), queues.expected_review_order);
  assert.deepEqual(Domain.calculateStudyQueueLimits({ mode: 'meaning', dailyQuota: 3, newToday: 1, wantAll: true }),
    { due_limit: queues.all_due_limit, new_limit: queues.all_new_limit });
  assert.equal(Domain.calculateStudyQueueLimits({ mode: 'learn', dailyQuota: 3, newToday: 1, requestedLimit: queues.learn_requested_limit }).new_limit,
    queues.expected_learn_limit);

  const draw = androidG1Fixture.card_draw;
  assert.equal(Domain.qualifiesForCard(draw.below, draw.target), false);
  assert.equal(Domain.qualifiesForCard(draw.at, draw.target), true);
  const rarityCards = ['N', 'R', 'SR', 'UR'].map((rarity, id) => ({ id, rarity }));
  assert.deepEqual(draw.random_values.map(value => Domain.pickWeightedCard(rarityCards, value).id), draw.expected_indexes);
});

test('spelling queues and input normalization support phrase-only vocabularies', () => {
  const phraseOnly = [
    { id: 1, word: 'ice cream' },
    { id: 2, word: 'mother-in-law' },
  ];

  assert.deepEqual(Domain.spellingWords(phraseOnly), phraseOnly);
  assert.equal(Domain.normalizeSpelling('  Ice   Cream  '), 'ice cream');
  assert.equal(Domain.filterSpellingInput('ICE   CREAM', 9), 'ice cream');
  assert.equal(Domain.normalizeSpellingAnswer(' ICE   CREAM '), 'ice cream');
  assert.equal(Domain.isSpellableWord('ice cream'), true);
  assert.deepEqual(Domain.spellingWords([{ word: '你好' }, { word: '42' }]), []);
});

test('sample vocabulary presentation is limited to exact audited built-in rows', () => {
  const cardinal = {
    id: 2687, word: 'cardinal 2', phonetic: 'ˈkɑːdɪnəl', pos: 'n.', meaning: '红衣主教',
  };
  const builtIn = Domain.sampleWordPresentation(cardinal, { name: '六级核心词汇', is_builtin: 1 });
  assert.equal(builtIn.display_word, 'cardinal');
  assert.equal(builtIn.answer_word, 'cardinal');
  assert.equal(builtIn.sense_label, '同形词 II');
  assert.equal(builtIn.phonetic_display, '/ˈkɑːdɪnəl/');
  assert.deepEqual(builtIn.meaning_groups, [{ heading: 'n.', items: ['红衣主教'] }]);
  assert.equal(Domain.spellingWords([{ ...cardinal, ...builtIn }]).length, 1);

  assert.equal(Domain.sampleWordPresentation(cardinal, { name: '自建词库', is_builtin: 0 }), null);
  assert.equal(Domain.sampleWordPresentation({ ...cardinal, word: 'web 3' }, { name: '自建词库', is_builtin: 0 }), null);
  assert.equal(Domain.sampleWordPresentation({ ...cardinal, meaning: '已修改释义' }, { name: '六级核心词汇', is_builtin: 1 }), null);
  assert.equal(Domain.sampleWordPresentation({ ...cardinal, word: 'cardinal 3' }, { name: '六级核心词汇', is_builtin: 1 }), null);
});

test('accuracy timeline preserves calendar gaps and only connects adjacent days with enough samples', () => {
  const now = new Date(2026, 8, 28, 12);
  const row = (day, total = 10, correct = 8) => ({ day, total, correct });
  const build = data => Domain.buildAccuracyTimeline(data, 30, now);
  const one = [row('2026-09-28')];
  const three = [row('2026-09-12'), row('2026-09-14'), row('2026-09-16')];
  const fourGaps = [...three, row('2026-09-27')];
  const fourAdjacent = [12, 13, 14, 15].map(day => row(`2026-09-${day}`));
  const thirty = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(2026, 7, 30 + i);
    return row(Domain.localDayKey(date));
  });

  assert.deepEqual(build([]).points, []);
  assert.equal(Domain.accuracyDisplayMode(build([])), 'empty');
  assert.equal(build(one).points.length, 1);
  assert.equal(Domain.accuracyDisplayMode(build(one)), 'records');
  assert.equal(Domain.accuracyDisplayMode(build(three)), 'records');
  assert.equal(Domain.accuracyDisplayMode(build(fourGaps)), 'records');
  assert.equal(build(three).segments.length, 0);
  assert.equal(build(fourGaps).points[3].index - build(fourGaps).points[2].index, 11);
  assert.equal(build(fourGaps).segments.length, 0);
  assert.deepEqual(build(fourAdjacent).segments.map(segment => segment.length), [4]);
  const sevenDense = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2026, 8, 22 + i);
    return row(Domain.localDayKey(date));
  });
  const sevenSparse = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2026, 7, 30 + i * 4);
    return row(Domain.localDayKey(date));
  });
  assert.equal(Domain.accuracyDisplayMode(build(sevenDense)), 'trend');
  assert.equal(Domain.accuracyDisplayMode(build(sevenSparse)), 'records');
  assert.deepEqual(build(thirty).segments.map(segment => segment.length), [30]);
  assert.equal(Domain.accuracyDisplayMode(build(thirty)), 'trend');
});

test('learn progress advances only when each revisited word is finally known', () => {
  const completed = new Set();

  let choice = Domain.recordLearnChoice(completed, 'word-a', true);
  assert.equal(choice.requeue, true);
  assert.equal(choice.completedCount, 0);
  assert.equal(Domain.progressPercent(choice.completedCount, 2), 0);

  choice = Domain.recordLearnChoice(completed, 'word-b', true);
  assert.equal(choice.completedCount, 0);
  assert.equal(Domain.progressPercent(choice.completedCount, 2), 0);

  choice = Domain.recordLearnChoice(completed, 'word-a', false);
  assert.equal(choice.completedCount, 1);
  assert.equal(Domain.progressPercent(choice.completedCount, 2), 50);

  choice = Domain.recordLearnChoice(completed, 'word-b', true);
  assert.equal(choice.completedCount, 1);
  choice = Domain.recordLearnChoice(completed, 'word-b', false);
  assert.equal(choice.completedCount, 2);
  assert.equal(Domain.progressPercent(choice.completedCount, 2), 100);

  assert.equal(Domain.recordLearnChoice(completed, 'word-a', false).completedCount, 2);
});
