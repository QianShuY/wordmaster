import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const androidRoot = fileURLToPath(new URL('../', import.meta.url));
const projectRoot = path.resolve(androidRoot, '..');
const sourceCards = path.join(projectRoot, 'static', 'cards', 'original');
const assetsRoot = path.join(androidRoot, 'android', 'app', 'src', 'main', 'assets');
const bundleOutput = path.join(androidRoot, 'seed', 'generated', 'wordmaster-seed.json');
const manifestOutput = path.join(androidRoot, 'seed', 'generated', 'seed-manifest.json');
const wordKeyLockPath = path.join(androidRoot, 'seed', 'word-key-lock.json');
const cardKeyLockPath = path.join(androidRoot, 'seed', 'card-key-lock.json');
const schemaPath = path.join(androidRoot, 'seed', 'schema-v1.sql');
const acceptSeedChanges = process.argv.includes('--accept-seed-changes');

const builtinBooks = [
  { key: 'builtin:zhongkao', name: '中考核心词汇', description: '中考英语大纲词汇（约 1600 词）', sortOrder: 0 },
  { key: 'builtin:cet4', name: '四级核心词汇', description: '大学英语四级高频词（精选 800 词）', sortOrder: 1 },
  { key: 'builtin:cet6', name: '六级核心词汇', description: '大学英语六级高频词（精选 600 词）', sortOrder: 2 },
  { key: 'builtin:npee', name: '考研大纲词汇', description: '考研英语大纲词汇（完整版，约 5500 词）', sortOrder: 3 },
  { key: 'builtin:tem', name: '英语专四专八词汇', description: '英语专业四八级词汇（约 12000 词）', sortOrder: 4 },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex').toUpperCase();
}

function stableJson(value) {
  return JSON.stringify(value);
}

function requireJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function readLock(file, format) {
  if (!existsSync(file)) return { format, books: {}, __freshLock: true };
  const lock = requireJson(file);
  if (lock.format !== format || !lock.books || typeof lock.books !== 'object') throw new Error(`seed 锁文件格式错误: ${file}`);
  return lock;
}

function writeJsonAtomically(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(temporary, file);
}

function lockWordKey(lock, bookKey, word, sourceOrder) {
  if (!lock.books[bookKey]) lock.books[bookKey] = {};
  const bookLock = lock.books[bookKey];
  if (bookLock[word]) return bookLock[word];
  if (!lock.__freshLock && Object.keys(bookLock).length && !acceptSeedChanges) {
    throw new Error(`seed 出现未锁定词条 ${bookKey} / ${word}；审阅后运行 node scripts/generate-seed.mjs --accept-seed-changes`);
  }
  let next = sourceOrder;
  if (!lock.__freshLock && !acceptSeedChanges) {
    throw new Error(`seed 出现未锁定词条 ${bookKey} / ${word}；审阅后运行 node scripts/generate-seed.mjs --accept-seed-changes`);
  }
  if (!lock.__freshLock && acceptSeedChanges) {
    let highest = 0;
    for (const key of Object.values(bookLock)) highest = Math.max(highest, Number(String(key).split(':').at(-1)) || 0);
    next = highest + 1;
  }
  const key = `${bookKey}:entry:${String(next).padStart(6, '0')}`;
  bookLock[word] = key;
  return key;
}

function lockCard(lock, palette, sourceId) {
  if (!lock.books.cards) lock.books.cards = {};
  const cards = lock.books.cards;
  if (cards[palette]) return cards[palette];
  if (!lock.__freshLock && Object.keys(cards).length && !acceptSeedChanges) {
    throw new Error(`seed 出现未锁定卡牌 ${palette}；审阅后运行 node scripts/generate-seed.mjs --accept-seed-changes`);
  }
  let id = sourceId;
  if (!lock.__freshLock && acceptSeedChanges) {
    let highest = 0;
    for (const card of Object.values(cards)) highest = Math.max(highest, Number(card.id) || 0);
    id = highest + 1;
  }
  const record = { id, card_key: `builtin-card:${palette}` };
  cards[palette] = record;
  return record;
}

function assertNoRemovedSeedKeys(lock, bookKey, currentWords, label) {
  const prior = lock.books[bookKey] || {};
  const current = new Set(currentWords);
  const removed = Object.keys(prior).filter(value => !current.has(value));
  if (removed.length && !acceptSeedChanges) {
    throw new Error(`${label} 移除了 ${removed.length} 个已锁定 key；需审阅并运行 node scripts/generate-seed.mjs --accept-seed-changes`);
  }
}

function ensureCardAssets(cards) {
  mkdirSync(assetsRoot, { recursive: true });
  const copy = {
    ...requireJson(path.join(projectRoot, 'static', 'cards', 'card-copy.json')),
    ...requireJson(path.join(projectRoot, 'app', 'seed', 'card-copy.hidden.json')),
  };
  const palettes = new Set();
  for (const card of cards) {
    if (palettes.has(card.palette)) throw new Error(`重复卡牌 palette: ${card.palette}`);
    palettes.add(card.palette);
    const filename = `${card.palette}.webp`;
    const source = path.join(sourceCards, filename);
    if (!existsSync(source)) throw new Error(`缺少卡牌图片: ${source}`);
    card.asset_path = `cards/original/${filename}`;
  }
  const missingCopy = cards.filter(card => !copy[card.palette]);
  if (missingCopy.length) throw new Error(`缺少卡牌文案: ${missingCopy.map(card => card.palette).join(', ')}`);
  writeFileSync(path.join(assetsRoot, 'card-copy.json'), `${JSON.stringify(copy, null, 2)}\n`, 'utf8');
  return copy;
}

function exportFreshWebSeed(tempDbPath) {
  process.env.WORDMASTER_DB_PATH = tempDbPath;
  const require = createRequire(import.meta.url);
  const { db, seed } = require(path.join(projectRoot, 'app', 'db.js'));
  const originalLog = console.log;
  try {
    console.log = () => {};
    db.exec('BEGIN IMMEDIATE');
    seed({ legacyAndroid: true });
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    db.close();
    throw error;
  } finally {
    console.log = originalLog;
  }

  const books = db.prepare('SELECT * FROM wordbooks WHERE is_builtin = 1 ORDER BY id').all();
  const wordLock = readLock(wordKeyLockPath, 'wordmaster-word-key-lock-v1');
  const cardLock = readLock(cardKeyLockPath, 'wordmaster-card-key-lock-v1');
  if (books.length !== builtinBooks.length) throw new Error(`預期 5 本内置词库，实际 ${books.length} 本`);
  const exportedBooks = books.map((sourceBook, index) => {
    const fixedBook = builtinBooks[index];
    if (sourceBook.name !== fixedBook.name) throw new Error(`词库顺序发生变化：${sourceBook.name}`);
    const sourceWords = db.prepare('SELECT * FROM words WHERE book_id = ? ORDER BY id').all(sourceBook.id);
    assertNoRemovedSeedKeys(wordLock, fixedBook.key, sourceWords.map(row => row.word), fixedBook.name);
    const words = sourceWords.map((row, rowIndex) => ({
      word_key: lockWordKey(wordLock, fixedBook.key, row.word, rowIndex + 1),
      legacy_id: row.id,
      book_key: fixedBook.key,
      word: row.word,
      phonetic: row.phonetic || '',
      pos: row.pos || '',
      meaning: row.meaning,
      example: row.example || '',
      seed_order: rowIndex + 1,
    }));
    return {
      book_key: fixedBook.key,
      legacy_id: sourceBook.id,
      name: fixedBook.name,
      description: fixedBook.description,
      is_builtin: 1,
      daily_new: sourceBook.daily_new ?? 15,
      daily_review: sourceBook.daily_review ?? 60,
      target_date: null,
      plan_active: 0,
      sort_order: fixedBook.sortOrder,
      words,
    };
  });

  const sourceCards = db.prepare('SELECT * FROM cards ORDER BY id').all();
  assertNoRemovedSeedKeys(cardLock, 'cards', sourceCards.map(row => row.palette), '卡牌');
  const cards = sourceCards.map(row => {
    const locked = lockCard(cardLock, row.palette, row.id);
    return {
    id: locked.id,
    card_key: locked.card_key,
    title: row.title,
    category: row.category,
    rarity: row.rarity,
    flavor: row.flavor || '',
    palette: row.palette,
    hidden: row.hidden,
    unlock_at: row.unlock_at,
    asset_path: '',
  };
  });
  db.close();
  return { books: exportedBooks, cards, wordLock, cardLock };
}

function createSeedDatabase(seed, bundleSha256, cardCopy, outputPath) {
  const schema = readFileSync(schemaPath, 'utf8');
  const db = new DatabaseSync(outputPath);
  try {
    db.exec(schema);
    db.exec('BEGIN IMMEDIATE');
    const insertBook = db.prepare(`INSERT INTO wordbooks
      (book_key, legacy_id, name, description, is_builtin, daily_new, daily_review, target_date, plan_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertWord = db.prepare(`INSERT INTO words
      (word_key, legacy_id, book_key, word, phonetic, pos, meaning, example, seed_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertCard = db.prepare(`INSERT INTO cards
      (id, card_key, title, category, rarity, flavor, palette, hidden, unlock_at, asset_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const book of seed.books) {
      insertBook.run(book.book_key, book.legacy_id, book.name, book.description, book.is_builtin,
        book.daily_new, book.daily_review, book.target_date, book.plan_active, book.sort_order);
      for (const word of book.words) {
        insertWord.run(word.word_key, word.legacy_id, word.book_key, word.word, word.phonetic,
          word.pos, word.meaning, word.example, word.seed_order);
      }
    }
    for (const card of seed.cards) {
      insertCard.run(card.id, card.card_key, card.title, card.category, card.rarity, card.flavor,
        card.palette, card.hidden, card.unlock_at, card.asset_path);
    }
    db.prepare(`UPDATE seed_import_state SET bundle_version = 1, bundle_sha256 = ?,
      completed_at = '2000-01-01 00:00:00'`).run(bundleSha256);
    db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('seed_bundle_sha256', bundleSha256);
    db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('seed_bundle_version', '1');
    db.prepare('INSERT INTO app_meta (key, value) VALUES (?, ?)').run('card_copy_json', stableJson(cardCopy));
    db.exec('COMMIT');
    db.exec('PRAGMA user_version = 1');
    db.exec('PRAGMA journal_mode = DELETE');
    db.exec('VACUUM');
    const integrity = db.prepare('PRAGMA integrity_check').get().integrity_check;
    if (integrity !== 'ok') throw new Error(`生成的隔离 seed SQLite integrity_check=${integrity}`);
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    throw error;
  } finally {
    db.close();
  }
}

const scratch = mkdtempSync(path.join(os.tmpdir(), 'wordmaster-g1-seed-'));
try {
  const sourceDbPath = path.join(scratch, 'web-seed.db');
  const androidDbPath = path.join(scratch, 'android-seed.db');
  const exported = exportFreshWebSeed(sourceDbPath);
  const cardCopy = ensureCardAssets(exported.cards);
  const bundle = {
    format: 'wordmaster-android-seed',
    bundle_version: 1,
    source_schema_version: 5,
    books: exported.books,
    cards: exported.cards,
    card_copy: cardCopy,
  };
  const canonicalBundle = stableJson(bundle);
  const bundleSha256 = sha256(canonicalBundle);
  const bundleWithHash = { ...bundle, bundle_sha256: bundleSha256 };
  mkdirSync(path.dirname(bundleOutput), { recursive: true });
  writeJsonAtomically(bundleOutput, bundleWithHash);
  delete exported.wordLock.__freshLock;
  delete exported.cardLock.__freshLock;
  writeJsonAtomically(wordKeyLockPath, exported.wordLock);
  writeJsonAtomically(cardKeyLockPath, exported.cardLock);
  const wordCount = exported.books.reduce((sum, book) => sum + book.words.length, 0);
  const manifest = {
    format: 'wordmaster-android-seed-manifest',
    bundle_version: 1,
    bundle_sha256: bundleSha256,
    source_schema_version: 5,
    counts: {
      wordbooks: exported.books.length,
      words: wordCount,
      progress: 0,
      review_log: 0,
      cards: exported.cards.length,
      user_cards: 0,
      card_draws: 0,
    },
    books: exported.books.map(book => ({ book_key: book.book_key, name: book.name, word_count: book.words.length })),
    cards: exported.cards.map(card => ({ id: card.id, card_key: card.card_key, palette: card.palette, asset_path: card.asset_path })),
  };

  createSeedDatabase(exported, bundleSha256, cardCopy, androidDbPath);
  manifest.database_sha256 = sha256(readFileSync(androidDbPath));
  mkdirSync(assetsRoot, { recursive: true });
  const seedAsset = path.join(assetsRoot, 'wordmaster-seed.db');
  const seedAssetTemp = `${seedAsset}.tmp`;
  copyFileSync(androidDbPath, seedAssetTemp);
  renameSync(seedAssetTemp, seedAsset);
  writeJsonAtomically(manifestOutput, manifest);
  writeJsonAtomically(path.join(assetsRoot, 'seed-manifest.json'), manifest);
  console.log(`G1 seed generated in an isolated temporary database: ${wordCount} words, ${exported.cards.length} cards, SHA-256 ${bundleSha256}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
