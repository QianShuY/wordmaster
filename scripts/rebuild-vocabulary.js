'use strict';
// Explicit maintenance command. Ordinary startup never resets an existing library.
if (!process.argv.includes('--apply-reset')) {
  console.error('先停止墨词，再运行 node scripts/rebuild-vocabulary.js --apply-reset。此命令重建内置词库并清空测试学习记录；自建词库和收藏保留。');
  process.exitCode = 1;
} else {
  const { randomUUID } = require('node:crypto');
  const { db, installBookContent } = require('../app/db');
  const { CATALOG } = require('../app/vocabulary');
  const before = {
    customWords: db.prepare('SELECT COUNT(*) n FROM words w JOIN wordbooks b ON b.id=w.book_id WHERE b.is_builtin=0').get().n,
    cards: db.prepare('SELECT COUNT(*) n FROM user_cards').get().n,
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('DELETE FROM review_log; DELETE FROM progress;');
    const reports = [];
    for (const spec of CATALOG) {
      let book = db.prepare('SELECT id FROM wordbooks WHERE name=? AND is_builtin=1').get(spec.name);
      if (!book) book = { id: Number(db.prepare('INSERT INTO wordbooks (name,is_builtin) VALUES (?,1)').run(spec.name).lastInsertRowid) };
      db.prepare('DELETE FROM words WHERE book_id=?').run(book.id);
      reports.push(installBookContent(book.id, spec));
    }
    db.exec("UPDATE wordbooks SET target_date=NULL,plan_active=0,plan_mode='date',daily_new=15");
    db.prepare('UPDATE desktop_database_identity SET instance_id=? WHERE id=1').run(randomUUID());
    if (db.prepare('SELECT COUNT(*) n FROM words w JOIN wordbooks b ON b.id=w.book_id WHERE b.is_builtin=0').get().n !== before.customWords
        || db.prepare('SELECT COUNT(*) n FROM user_cards').get().n !== before.cards) throw new Error('自建词库或收藏发生非预期变化');
    if (db.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('数据库完整性检查失败');
    db.exec('COMMIT');
    console.log(JSON.stringify({ reset: true, preserved: before, books: reports.map(({ name, accepted, excluded }) => ({ name, accepted, excluded })) }, null, 2));
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  finally { db.close(); }
}
