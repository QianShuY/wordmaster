'use strict';

// Desktop-only presentation layer. XP and stamps are computed from existing
// review history; they never change a word's real spaced-repetition schedule.
const STAMPS = Object.freeze([
  { id: 'first', title: '落笔', description: '完成首次作答', threshold: 1, field: 'attempts' },
  { id: 'answers50', title: '渐入佳境', description: '累计作答 50 次', threshold: 50, field: 'attempts' },
  { id: 'streak3', title: '三日不辍', description: '连续学习 3 天', threshold: 3, field: 'longestStreak' },
  { id: 'answers200', title: '百炼成墨', description: '累计作答 200 次', threshold: 200, field: 'attempts' },
  { id: 'master50', title: '熟能生巧', description: '掌握 50 个单词', threshold: 50, field: 'mastered' },
  { id: 'cards5', title: '墨藏初成', description: '收藏 5 张卡牌', threshold: 5, field: 'cards' },
]);

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayOrdinal(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const [year, month, date] = day.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, date);
  const actual = new Date(utc);
  if (actual.getUTCFullYear() !== year || actual.getUTCMonth() !== month - 1 || actual.getUTCDate() !== date) return NaN;
  return Math.floor(utc / 86400000);
}

function streaks(days, today = new Date()) {
  const ordinals = [...new Set((days || [])
    .map(row => dayOrdinal(typeof row === 'string' ? row : row?.day))
    .filter(Number.isFinite))].sort((a, b) => a - b);
  const latest = ordinals.at(-1);
  const todayOrdinal = dayOrdinal(dayKey(today));
  let current = 0, longest = 0, run = 0, prev;
  for (const ordinal of ordinals) {
    run = ordinal === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = ordinal;
  }
  if (latest === todayOrdinal || latest === todayOrdinal - 1) {
    for (let i = ordinals.length - 1; i >= 0; i--) {
      if (i < ordinals.length - 1 && ordinals[i] !== ordinals[i + 1] - 1) break;
      current++;
    }
  }
  return { current, longest };
}

function calculateLevel(rawXp) {
  const xp = Math.max(0, Math.floor(Number(rawXp) || 0));
  // Level 2 at 100 XP, level 3 at 300 XP, level 4 at 600 XP.
  let level = Math.floor((Math.sqrt(1 + xp / 12.5) - 1) / 2) + 1;
  level = Math.max(1, level);
  // Correct precision if XP becomes large.
  while (50 * level * (level + 1) <= xp) level++;
  while (level > 1 && 50 * (level - 1) * level > xp) level--;
  const start = 50 * (level - 1) * level;
  const next = 50 * level * (level + 1);
  return { xp, level, current: xp - start, required: next - start, nextLevelAt: next };
}

function buildJourney({ totals = {}, activeDays = [], daily = [], mastered = 0, ownedCards = 0, today = new Date() } = {}) {
  const counts = {
    attempts: Math.max(0, Number(totals.attempts) || 0),
    mastered: Math.max(0, Number(mastered) || 0),
    cards: Math.max(0, Number(ownedCards) || 0),
    ...streaks(activeDays, today),
  };
  const level = calculateLevel(totals.xp);
  const stamps = STAMPS.map(item => ({
    id: item.id, title: item.title, description: item.description,
    unlocked: counts[item.field] >= item.threshold,
    progress: Math.min(counts[item.field], item.threshold),
    target: item.threshold,
  }));
  const rows = new Map((daily || []).map(row => [row.day, Math.max(0, Number(row.total) || 0)]));
  const last7 = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = dayKey(d);
    last7.push({ day: key, count: rows.get(key) || 0, isToday: offset === 0 });
  }
  const answeredToday = last7[6].count;
  return {
    level, streak: counts.current, longestStreak: counts.longest,
    attempts: counts.attempts,
    answeredToday, dailyTarget: 10,
    last7, stamps,
    unlockedCount: stamps.filter(s => s.unlocked).length,
  };
}

module.exports = { STAMPS, dayOrdinal, streaks, calculateLevel, buildJourney };
