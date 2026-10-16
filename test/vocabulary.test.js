'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const { CATALOG, buildBook, parseSourceLine, parseImportLine } = require('../app/vocabulary');
const Domain = require('../shared/domain');

test('source parsing rejects misplaced fields and preserves numbered homographs', () => {
  const w = parseSourceLine('* pancake [ˈpæŋkeɪk] n. 薄煎饼').entry;
  assert.equal(w.word, 'pancake'); assert.equal(w.pos, 'n.');
  const numbered = parseSourceLine('attribute 1[əˈtrɪbjʊːt] v. 把…归因于').entry;
  assert.equal(numbered.headword, 'attribute'); assert.equal(numbered.homograph, 1);
  const view = Domain.sampleWordPresentation(numbered, { is_builtin: 1 });
  assert.equal(view, null, 'metadata without audited source cannot change spelling');
  const audited = Domain.sampleWordPresentation({ ...numbered, source_file: 'cet6.txt' }, { is_builtin: 1 });
  assert.equal(audited.answer_word, 'attribute');
  assert.equal(Domain.judgeAnswer('spelling', 'attribute', { ...numbered, ...audited }), true);
  assert.equal(Domain.sampleWordPresentation({ ...numbered, source_file: 'cet6.txt' }, { is_builtin: 0 }), null);
  assert.equal(parseSourceLine('broken [test] mysterious. 损坏').status, 'excluded');
  assert.equal(parseSourceLine('a, an [eɪ] art. 一个').status, 'excluded');
  assert.equal(parseSourceLine('abolish [x] n. 废除，消除 v. 废除，取消').entry.pos, 'v.');
  assert.equal(parseSourceLine('restrain [rɪˈstreɪ] v. 克制，抑制，约束，制止').entry.phonetic, 'rɪˈstreɪn');
  assert.equal(parseImportLine('restrain [rɪˈstreɪ] v. 自建释义').phonetic, 'rɪˈstreɪ');
});

test('all source rows reconcile and builds are deterministic without alphabetic truncation', () => {
  for (const spec of CATALOG) {
    const a = buildBook(spec), b = buildBook(spec);
    assert.deepEqual(a, b);
    const r = a.report;
    assert.equal(r.nonempty, r.headings + r.accepted + r.duplicates + r.excluded);
    assert.ok(r.letters.includes('Z'));
    assert.equal(new Set(a.words.map(w => w.word)).size, a.words.length);
    for (const w of a.words) {
      assert.ok(Domain.isSpellableWord(w.headword));
      assert.ok(w.meaning.trim()); assert.ok(w.source_line > 0); assert.ok(w.source_raw);
    }
    if (spec.file === 'cet4.txt') assert.ok(a.words.length > 4000);
    if (spec.file === 'cet6.txt') assert.ok(a.words.length > 2000);
  }
});

test('quoted imports retain commas, empty POS columns, and custom numbered headwords', () => {
  assert.deepEqual(parseImportLine('"record",n.,"记录,档案"'), { word: 'record', pos: 'n.', phonetic: '', meaning: '记录,档案' });
  assert.equal(parseImportLine('apple,,苹果').pos, '');
  assert.equal(parseImportLine('apple\t\t苹果').meaning, '苹果');
  assert.equal(parseImportLine('"broken,n.,坏行'), null);
  assert.equal(parseImportLine('web 3 n. 自建词条').word, 'web 3');
  assert.equal(parseImportLine('abolish [x] n. 废除，消除 v. 废除，取消').pos, 'n.', 'user content is not silently corrected');
});

test('ambiguous POS never becomes a single-answer quiz', () => {
  assert.equal(Domain.isUnambiguousPos({ pos: 'vt./vi.', meaning: '移动' }), true);
  assert.equal(Domain.isUnambiguousPos({ pos: 'n./v.', meaning: '记录' }), false);
  assert.equal(Domain.isUnambiguousPos({ pos: 'n.', meaning: '记录 v. 记录下来' }), false);
  assert.equal(Domain.isUnambiguousPos({ pos: 'n.', meaning: '记录；v.记录下来' }), false);
  assert.equal(Domain.judgeAnswer('pos', 'n.', { pos: 'n.', meaning: '记录 v. 记录下来' }), null);
  assert.equal(Domain.isUnambiguousPos({ pos: 'num.', meaning: '一百' }), false);
});

test('explicit rebuild resets test learning, preserves custom words/cards, and invalidates checkpoints', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wordmaster-rebuild-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const dbPath = path.join(dir, 'test.db'), cwd = path.resolve(__dirname, '..');
  const env = { ...process.env, WORDMASTER_DB_PATH: dbPath };
  execFileSync(process.execPath, ['-e', `const {db}=require('./app/db'); db.exec("INSERT INTO wordbooks(id,name,is_builtin) VALUES(99,'自建',0); INSERT INTO words(id,book_id,word,meaning) VALUES(99,99,'web 3','自己的词'); INSERT INTO progress(word_id,correct) VALUES(99,5); INSERT INTO review_log(word_id,correct) VALUES(99,1); INSERT INTO cards(id,title,category,palette) VALUES(99,'收藏','测试','retained'); INSERT INTO user_cards(card_id) VALUES(99)"); console.log(db.prepare('SELECT instance_id FROM desktop_database_identity').get());db.close();`], { cwd, env });
  let initial = new DatabaseSync(dbPath, { readOnly: true });
  const oldIdentity = initial.prepare('SELECT instance_id FROM desktop_database_identity').get().instance_id; initial.close();
  for (let run = 0; run < 2; run++) {
    execFileSync(process.execPath, ['scripts/rebuild-vocabulary.js', '--apply-reset'], { cwd, env });
    const db = new DatabaseSync(dbPath, { readOnly: true });
    assert.equal(db.prepare('SELECT COUNT(*) n FROM progress').get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM review_log').get().n, 0);
    assert.equal(db.prepare('SELECT word FROM words WHERE id=99').get().word, 'web 3');
    assert.equal(db.prepare('SELECT COUNT(*) n FROM user_cards').get().n, 1);
    assert.notEqual(db.prepare('SELECT instance_id FROM desktop_database_identity').get().instance_id, oldIdentity);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM words WHERE TRIM(word)='' OR TRIM(meaning)=''").get().n, 0);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM vocabulary_builds').get().n, 5);
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    const expected = CATALOG.reduce((n, spec) => n + buildBook(spec).words.length, 1);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM words').get().n, expected);
    db.close();
  }
});
