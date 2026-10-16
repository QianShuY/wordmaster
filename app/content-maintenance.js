'use strict';
const {createHash}=require('node:crypto');
const V=require('./vocabulary');
const {reviewedExample,reviewedPhonetic}=require('../shared/content-batch');
const {reviewedMeaning}=require('../shared/content-corrections');
const {reviewedSymbol}=require('../shared/phonetic-symbols');
const corrections=require('./seed/cet6-corrections.json');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Include all non-content tables, including future chapter saves, and preserve word IDs.
function protectedDigest(db) {
  const data = {};
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('words','wordbooks','vocabulary_builds','sqlite_sequence') ORDER BY name").all();
  for (const { name } of tables) data[name] = db.prepare(`SELECT * FROM "${name.replaceAll('"','""')}" ORDER BY rowid`).all();
  data.identities = db.prepare('SELECT id,book_id,word FROM words ORDER BY id').all();
  data.plans = db.prepare('SELECT * FROM wordbooks ORDER BY id').all();
  return hash(data);
}
function improve(db, { apply = false, verify, bookIds } = {}) {
  const results = [];
  const scope=bookIds===undefined?null:new Set(bookIds);
  db.exec(apply ? 'BEGIN IMMEDIATE' : 'BEGIN');
  try {
    const before = protectedDigest(db);
    for (const spec of V.CATALOG) {
      const built = V.buildBook(spec);
      const book = db.prepare('SELECT b.id,v.source_sha256 FROM wordbooks b LEFT JOIN vocabulary_builds v ON v.book_id=b.id WHERE b.is_builtin=1 AND b.name=?').get(spec.name);
      if (!book) { results.push({ book: spec.name, skipped: 'not-installed' }); continue; }
      if(scope&&!scope.has(book.id)){results.push({book:spec.name,skipped:'not-requested'});continue;}
      if (book.source_sha256 !== built.report.sha256) { results.push({ book: spec.name, skipped: 'source-hash-mismatch' }); continue; }
      const source = new Map(built.words.map(w => [w.word, w]));
      const result = { book: spec.name, examples_added: 0, phonetics_patched: 0, meanings_patched:0, edited_rows_skipped: 0, items: [] };
      for (const row of db.prepare('SELECT * FROM words WHERE book_id=? ORDER BY id').all(book.id)) {
        const expected = source.get(row.word);
        // An edited phonetic must also block filling a sentence for an unverified row.
        const fix = reviewedPhonetic(row) || corrections.find(f => f.word === row.word && f.from.pos === row.pos && f.from.meaning === row.meaning && f.from.phonetic === row.phonetic);
        let meaningFix=reviewedMeaning(row);
        const symbol=reviewedSymbol({...row,meaning:meaningFix?.to.meaning||row.meaning,phonetic:fix?.to.phonetic||row.phonetic});
        const finalPhonetic=symbol?.to.phonetic||fix?.to.phonetic||row.phonetic;
        meaningFix=meaningFix||reviewedMeaning({...row,phonetic:finalPhonetic});
        if (!expected || row.source_file !== spec.file || row.source_raw !== expected.source_raw || row.source_line !== expected.source_line || row.headword !== expected.headword || row.homograph !== expected.homograph || row.pos !== expected.pos || (row.meaning !== expected.meaning && !meaningFix) || finalPhonetic !== expected.phonetic) {
          result.edited_rows_skipped++; continue;
        }
        const example = reviewedExample({...row,meaning:meaningFix?.to.meaning||row.meaning,phonetic:finalPhonetic});
        if (example && !String(row.example || '').trim() && !String(row.example_translation || '').trim()) {
          result.examples_added++; result.items.push({ id: row.id, word: row.word, field: 'paired-example' });
          if (apply) db.prepare('UPDATE words SET example=?,example_translation=? WHERE id=?').run(example.text, example.translation, row.id);
        }
        if (finalPhonetic !== row.phonetic) {
          result.phonetics_patched++; result.items.push({ id: row.id, word: row.word, field: 'phonetic', from: row.phonetic, to: finalPhonetic, source: symbol?.source||fix?.source });
          if (apply) db.prepare('UPDATE words SET phonetic=? WHERE id=?').run(finalPhonetic, row.id);
        }
        if(meaningFix&&meaningFix.to.meaning===expected.meaning){
          result.meanings_patched++;result.items.push({id:row.id,word:row.word,field:'meaning',from:row.meaning,to:meaningFix.to.meaning,source:meaningFix.source});
          if(apply)db.prepare('UPDATE words SET meaning=? WHERE id=?').run(meaningFix.to.meaning,row.id);
        }
      }
      if (apply) db.prepare('UPDATE vocabulary_builds SET content_version=?,audit_json=? WHERE book_id=?').run(V.VERSION, JSON.stringify(built.report), book.id);
      results.push(result);
    }
    if (verify) verify({db,results,version:V.VERSION});
    const after = protectedDigest(db);
    if (before !== after) throw new Error('Protected state changed; content transaction rolled back');
    db.exec(apply ? 'COMMIT' : 'ROLLBACK');
    return { apply, version: V.VERSION, protected_before: before, protected_after: after, learning_and_plans_unchanged: true, results };
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
module.exports={improve,protectedDigest};
