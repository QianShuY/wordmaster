'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Domain = require('../shared/domain');

const html = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '../static/app.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../static/desktop-redesign.css'), 'utf8');

test('desktop study desk has unique named controls and preserves the Android original', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'duplicate ids break desktop and Android selectors');
  const essentials = [
    'todayBookSelect', 'todayContinue', 'todayTaskSummary', 'planModal', 'planDate',
    'desktopTodayHub', 'desktopTodayBookSelect', 'hubPlanTitle', 'hubPlanProgress',
    'hubDueCount', 'hubNewProgress', 'hubStart', 'hubEditPlan', 'desktopHubRound',
    'desktopPlanModal', 'desktopPlanForm', 'desktopPlanDate', 'desktopPlanSave',
    'desktopPlanRemove', 'desktopPlanAdvice',
  ];
  for (const id of essentials) {
    assert.ok(ids.includes(id), `missing control #${id}`);
  }
  assert.ok(html.includes('href="desktop-redesign.css"'));
  assert.match(styles, /is-android-app .*desktop-today-hub/);
  assert.match(js, /DesktopHub\.render\(books, book, mistakeCount\)/);
  assert.match(js, /Domain\.calculatePlan\(\{ remainingNew: left, planActive: true, targetDate: date \}\)/);
});

test('plan preview uses the same inclusive days and quota rules as the server', () => {
  const now = new Date(2026, 9, 9, 12);
  const cases = [
    { remaining: 586, date: '2026-10-09', expectedDays: 1, quota: 200 },
    { remaining: 586, date: '2026-11-07', expectedDays: 30, quota: 20 },
    { remaining: 0, date: '2026-11-07', expectedDays: 30, quota: 0 },
  ];
  for (const { remaining, date, expectedDays, quota } of cases) {
    const plan = Domain.calculatePlan({
      remainingNew: remaining, planActive: true, targetDate: date, now,
    });
    assert.equal(plan.days_left, expectedDays);
    assert.equal(plan.daily_quota, quota);
    if (remaining > 0 && Math.ceil(remaining / expectedDays) > 200) {
      assert.ok(Math.ceil(remaining / expectedDays) > plan.daily_quota,
        'desktop UI must warn when the system cap prevents reaching the goal');
    }
  }
});
