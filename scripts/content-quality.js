'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const V = require('../app/vocabulary');
const D = require('../shared/domain');
const { reviewedExample } = require('../shared/content-batch');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const {improve,protectedDigest}=require('../app/content-maintenance');
function inventory(db) {
  const books = [];
  for (const spec of V.CATALOG) {
    const built = V.buildBook(spec);
    const book = db.prepare('SELECT * FROM wordbooks WHERE name=? AND is_builtin=1').get(spec.name);
    const build = book && db.prepare('SELECT * FROM vocabulary_builds WHERE book_id=?').get(book.id);
    const rows = book ? db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(book.id) : [];
    const builtSource = new Map(built.words.map(w => [w.word,w]));
    const items = rows.map(w => {
      const grouped = D.structureMeaning(w.pos,w.meaning);
      const ex = reviewedExample(w);
      const recovered = builtSource.get(w.word);
      const recoveryReviewed = recovered?.reviewed_example && recovered.source_raw === w.source_raw && recovered.pos === w.pos && recovered.meaning === w.meaning && recovered.phonetic === w.phonetic && recovered.reviewed_example.text === w.example && recovered.reviewed_example.translation === w.example_translation;
      return { id: w.id, word: w.word, source_line: w.source_line, content_hash: hash([w.word,w.pos,w.meaning,w.phonetic,w.example,w.example_translation]),
        paired_example: Boolean(String(w.example || '').trim() && String(w.example_translation || '').trim()),
        example_review: recoveryReviewed ? 'sense-reviewed-recovery-20261013' : ex && ex.text === w.example && ex.translation === w.example_translation ? 'sense-reviewed-source-bound' : 'not-tracked-in-this-batch',
        language_review: 'pending-full-review',
        flags: [!String(w.example || '').trim() || !String(w.example_translation || '').trim() ? 'missing-paired-example' : null,
          /[әє?∫\uE000-\uF8FF\uFFFD]/u.test(w.phonetic) ? 'suspicious-phonetic-symbol' : null,
          !String(w.phonetic||'').trim() ? 'missing-phonetic' : null,
          !grouped.meaning_groups.length ? 'empty-meaning-structure' : null].filter(Boolean),
        pos_groups: grouped.meaning_groups.length, phrase_notes: grouped.meaning_notes.length };
    });
    books.push({ name: spec.name, book_id: book?.id || null, source_file: spec.file, source_sha256: built.report.sha256,
      installed_source_matches: build?.source_sha256 === built.report.sha256,
      planned_action: spec.file === 'zhongkao.txt' ? 'replace-with-verified-gaokao-content' : 'retain-and-review-all-entries',
      source_rows: built.report.nonempty, valid_source_entries: built.report.accepted, quarantined_source_rows: built.report.excluded,
      total_installed: rows.length, paired_examples: items.filter(x => x.paired_example).length,
      batch_reviewed_examples: items.filter(x => x.example_review.startsWith('sense-reviewed')).length,
      pending_examples: items.filter(x => !x.paired_example).length,
      suspicious_phonetics: items.filter(x => x.flags.includes('suspicious-phonetic-symbol')).length,
      missing_phonetics: items.filter(x => x.flags.includes('missing-phonetic')).length,
      excluded: built.report.issues, items });
  }
  return { date: '2026-10-13', version: V.VERSION, note: 'All installed entries are counted. Structural checks and paired text presence are not full language approval.', books };
}
function writeInventory(report, dir) {
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'all-books-2026-10-13.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'ALL_BOOKS_2026-10-13.md'), '# 全词库内容清单 · 2026-10-13\n\n统计分母是各库全部已安装有效词条。双语文本存在不等于逐条语言审校通过；本批审核例句单列。中考暂保留至高考内容核验通过。\n\n| 词库 | 有效词条 | 已有双语例句 | 本批审核例句 | 缺例句 | 可疑音标 | 隔离源行 |\n| --- | --- | --- | --- | --- | --- | --- |\n' + report.books.map(b=>`| ${b.name} | ${b.total_installed} | ${b.paired_examples} | ${b.batch_reviewed_examples} | ${b.pending_examples} | ${b.suspicious_phonetics} | ${b.quarantined_source_rows} |`).join('\n') + '\n\n逐词内容指纹、审核状态、问题标签和隔离原文见同目录 all-books-2026-10-13.json。\n');
}
if (require.main === module) {
  const apply = process.argv.includes('--apply');
  const file = path.resolve(process.env.WORDMASTER_DB_PATH || path.join(__dirname,'../data/wordmaster.db'));
  const db = new DatabaseSync(file,{readOnly:!apply});
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
  try {
    const result = improve(db,{apply});
    const dir = path.join(__dirname,'../docs/vocabulary-audit');
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,`content-batch-2026-10-13${apply?'':'-preview'}.json`),JSON.stringify(result,null,2)+'\n');
    writeInventory(inventory(db),dir);
    console.log(JSON.stringify({ ...result, results: result.results.map(({items,...r})=>r) },null,2));
  } finally { db.close(); }
}
module.exports = { improve, inventory, protectedDigest, writeInventory };
