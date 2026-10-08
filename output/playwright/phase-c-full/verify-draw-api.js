'use strict';
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.resolve(__dirname, 'integration-test.sqlite');
const db = new DatabaseSync(dbPath);
db.exec('BEGIN IMMEDIATE; DELETE FROM user_cards; DELETE FROM review_log; DELETE FROM card_draws;');
const addCard = db.prepare('INSERT INTO user_cards (card_id, earned_at) VALUES (?, ?)');
for (let id = 1; id <= 9; id++) addCard.run(id, '2026-09-26 12:00:00');
const addReview = db.prepare('INSERT INTO review_log (word_id, correct, is_new) VALUES (1, 1, 0)');
for (let i = 0; i < 10; i++) addReview.run();
db.exec('COMMIT');
db.close();

(async () => {
  const base = 'http://localhost:3457';
  const beforeCards = await (await fetch(`${base}/api/cards`)).json();
  const beforeCopy = await (await fetch(`${base}/api/cards/copy`, { cache: 'no-store' })).json();
  const hiddenPalettes = ['hawking', 'qingming', 'voyager'];
  const hiddenCopyBefore = hiddenPalettes.filter(palette => palette in beforeCopy);
  const drawResponse = await fetch(`${base}/api/cards/draw`, { method: 'POST' });
  const draw = await drawResponse.json();
  const afterCards = await (await fetch(`${base}/api/cards`)).json();
  const afterCopy = await (await fetch(`${base}/api/cards/copy`, { cache: 'no-store' })).json();
  const duplicateStatus = (await fetch(`${base}/api/cards/draw`, { method: 'POST' })).status;
  const check = new DatabaseSync(dbPath, { readOnly: true });
  const result = {
    before: { owned: beforeCards.owned, copyCount: Object.keys(beforeCopy).length, hiddenCopy: hiddenCopyBefore },
    draw: { status: drawResponse.status, normalPalette: draw.card?.palette, unlockedPalettes: (draw.unlocked || []).map(card => card.palette), reportedOwned: draw.owned },
    after: { owned: afterCards.owned, hiddenOwned: afterCards.cards.filter(card => card.hidden && card.owned).length, copyCount: Object.keys(afterCopy).length, hawkingCopyVisible: 'hawking' in afterCopy },
    duplicateStatus,
    integrity: check.prepare('PRAGMA integrity_check').get().integrity_check,
  };
  check.close();
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; });
