'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const publicCopy = require('../static/cards/card-copy.json');
const hiddenCopy = require('../app/seed/card-copy.hidden.json');
const hiddenPalettes = ['hawking', 'qingming', 'voyager'];
const copy = { ...publicCopy, ...hiddenCopy };

test('62 palettes have a complete, distinct bilingual card entry', () => {
  const entries = Object.entries(copy);
  assert.equal(entries.length, 62);
  assert.equal(Object.keys(publicCopy).length, 59);
  assert.deepEqual(Object.keys(hiddenCopy).sort(), hiddenPalettes);
  for (const palette of hiddenPalettes) assert.equal(publicCopy[palette], undefined, `${palette} stays server-side until unlock`);
  for (const [palette, card] of entries) {
    assert.ok(palette, 'palette key is present');
    for (const field of ['encouragement', 'englishEncouragement']) {
      assert.equal(typeof card[field], 'string', `${palette}.${field} is a string`);
      assert.ok(card[field].trim(), `${palette}.${field} is not empty`);
    }
    assert.ok(!card.coverLine || card.coverLine.trim(), `${palette}.coverLine is optional and non-empty when present`);
    assert.ok(Object.keys(card).every(field => ['coverLine', 'focus', 'foilFocus', 'encouragement', 'englishEncouragement'].includes(field)), `${palette} stores no knowledge text, source, or obsolete metadata`);
    assert.equal(JSON.stringify(card).match(/https?:\/\//g)?.length || 0, 0, `${palette} has no external URL`);
  }
  for (const field of ['encouragement', 'englishEncouragement']) {
    const values = entries.map(([, card]) => card[field]);
    assert.equal(new Set(values).size, values.length, `${field} entries are individually written`);
  }
});

test('card detail templates contain no knowledge/source sections or external anchors', () => {
  const appSource = require('node:fs').readFileSync(require.resolve('../static/app.js'), 'utf8');
  assert.doesNotMatch(appSource, /cardSourceHtml|prototype-detail__knowledge|prototype-detail__source/);
  assert.match(appSource, /收藏寄语/);
  assert.match(appSource, /englishEncouragement/);
});
