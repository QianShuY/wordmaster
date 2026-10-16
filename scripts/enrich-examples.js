'use strict';
// Add reviewed examples without rebuilding words or resetting study records.
const { db } = require('../app/db');
const Domain = require('../shared/domain');
const examples = require('../app/seed/reviewed-examples.json');
const Vocabulary = require('../app/vocabulary');
function patchPhonetics() {
  let count = 0;
  db.exec('BEGIN IMMEDIATE');
  try {
    const patch = db.prepare(`UPDATE words SET phonetic='rɪˈstreɪn' WHERE book_id=?
      AND word='restrain' AND headword='restrain' AND phonetic='rɪˈstreɪ'
      AND source_file=? AND source_raw=? AND pos='v.' AND meaning='克制，抑制，约束，制止'`);
    for (const spec of Vocabulary.CATALOG) {
      const book = db.prepare('SELECT b.id,v.source_sha256 FROM wordbooks b JOIN vocabulary_builds v ON v.book_id=b.id WHERE b.name=? AND b.is_builtin=1').get(spec.name);
      if (!book) continue;
      const {words,report} = Vocabulary.buildBook(spec);
      if (report.sha256 !== book.source_sha256) continue; // Never relabel a different source build.
      const restrain = words.find(w => w.word === 'restrain' && w.source_raw.includes('[rɪˈstreɪ]'));
      if (restrain) count += Number(patch.run(book.id,spec.file,restrain.source_raw).changes);
      db.prepare('UPDATE vocabulary_builds SET content_version=?,audit_json=? WHERE book_id=?').run(Vocabulary.VERSION,JSON.stringify(report),book.id);
      // Refresh only the generated description, preserving a manually edited one.
      db.prepare('UPDATE wordbooks SET description=replace(description,?,?) WHERE id=?').run('版本 2026-10-11.1。',`版本 ${Vocabulary.VERSION}。`,book.id);
    }
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
  return count;
}
function enrich() {
  const candidates = db.prepare(`SELECT w.* FROM words w JOIN wordbooks b ON b.id=w.book_id
    WHERE b.is_builtin=1 AND w.source_file IS NOT NULL AND w.headword IS NOT NULL
      AND w.homograph IS NULL AND coalesce(w.example,'')='' AND coalesce(w.example_translation,'')=''`).all();
  const update = db.prepare('UPDATE words SET example=?,example_translation=? WHERE id=?');
  let count = 0;
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const word of candidates) {
      const example = examples[word.headword];
      if (example && Domain.normalizePartOfSpeech(word.pos) === example.pos) {
        update.run(example.text, example.translation, word.id); count++;
      }
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return count;
}
if (require.main === module) {
  if (!process.argv.includes('--apply')) { console.error('Use --apply to add reviewed examples. No learning data is reset.'); process.exitCode = 1; }
  else console.log(JSON.stringify({ phonetics_patched: patchPhonetics(), added: enrich(), reviewed_sets: Object.keys(examples).length }));
  db.close();
}
module.exports = { enrich };
