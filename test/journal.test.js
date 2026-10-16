'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const Journal = require('../shared/journal');

test('theme editorial uses distinct card headlines and scene labels while classic restores original wording', () => {
  const copies = require('../static/cards/card-copy.json');
  for (const palette of Object.keys(copies)) {
    const text = Journal.themeCopy({palette,title:palette},copies[palette]);
    assert.ok(text.title && text.title !== Journal.themeCopy(null).title);
    assert.ok(text.plan.includes('长期方向'));
    assert.ok(text.action.includes('当下任务'));
  }
  assert.ok(Journal.themeCopy({palette:'library',title:'图书馆'},copies.library).plan.includes('藏书计划'));
  assert.equal(Journal.themeCopy({palette:'library',title:'图书馆'},copies.library).title,'让新的词，住进你的书架。');
  assert.ok(Journal.themeCopy({palette:'sahara',title:'撒哈拉'},copies.sahara).action.includes('今日驿站'));
  assert.ok(Journal.themeCopy({palette:'godel',title:'哥德尔'},copies.godel).action.includes('今日命题'));
  assert.equal(Journal.themeCopy(null).title,'每学一词，远行一步。');
  assert.equal(Journal.themeCopy(null).planNote,'');
});

test('all 59 ordinary illustrations belong to one chapter; hidden cards never affect chapter completion', () => {
  const palettes = Journal.chapters.flatMap(c => c.palettes);
  const copy = require('../static/cards/card-copy.json');
  assert.equal(palettes.length, 59);
  assert.equal(new Set(palettes).size, 59);
  assert.deepEqual([...palettes].sort(), Object.keys(copy).sort());
  const cards = palettes.map(palette => ({ palette, hidden: 0, owned: false }));
  cards.push({ palette: 'locked', hidden: 1, owned: true });
  assert.equal(Journal.chapterFor(cards.at(-1)), null);
  assert.deepEqual(Journal.summarize(cards).map(c => [c.total,c.owned,c.complete]), [[17,0,false],[23,0,false],[19,0,false]]);
  cards.forEach(c => { c.owned = true; });
  assert.ok(Journal.summarize(cards).every(c => c.complete));
});

test('example enrichment is idempotent and preserves word IDs, user content, learning and cards', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wordmaster-examples-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const script = `
    const assert=require('node:assert/strict'); const {db}=require('./app/db');
    db.exec("INSERT INTO wordbooks(id,name,is_builtin) VALUES(1,'内置',1),(2,'自建',0); INSERT INTO words(id,book_id,word,headword,pos,meaning,source_file,example) VALUES(1,1,'collect','collect','vt.','收集','cet4.txt',''),(2,1,'arrive','arrive','v.','到达','cet4.txt','用户例句'),(3,2,'collect','collect','v.','自建','custom',''); INSERT INTO progress(word_id,correct) VALUES(1,4); INSERT INTO review_log(word_id,correct) VALUES(1,1); INSERT INTO cards(id,title,category,palette) VALUES(1,'收藏','测试','retained'); INSERT INTO user_cards(card_id) VALUES(1)");
    const identity=db.prepare('SELECT instance_id FROM desktop_database_identity').get().instance_id;
    const {enrich}=require('./scripts/enrich-examples');assert.equal(enrich(),1);assert.equal(enrich(),0);
    assert.ok(db.prepare('SELECT example_translation FROM words WHERE id=1').get().example_translation);
    assert.equal(db.prepare('SELECT example FROM words WHERE id=2').get().example,'用户例句');
    assert.equal(db.prepare('SELECT example FROM words WHERE id=3').get().example,'');
    assert.equal(db.prepare('SELECT correct FROM progress WHERE word_id=1').get().correct,4);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM review_log').get().n,1);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM user_cards').get().n,1);
    assert.equal(db.prepare('SELECT instance_id FROM desktop_database_identity').get().instance_id,identity);db.close();`;
  execFileSync(process.execPath, ['-e', script], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, WORDMASTER_DB_PATH: path.join(dir,'test.db') } });
});
