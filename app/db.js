'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.resolve(process.env.WORDMASTER_DB_PATH || path.join(DEFAULT_DATA_DIR, 'wordmaster.db'));
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS wordbooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_builtin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL REFERENCES wordbooks(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT DEFAULT '',
  pos TEXT DEFAULT '',
  meaning TEXT NOT NULL,
  example TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  UNIQUE(book_id, word)
);
CREATE TABLE IF NOT EXISTS progress (
  word_id INTEGER PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE,
  correct INTEGER DEFAULT 0,
  wrong INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_review TEXT,
  next_due TEXT
);
CREATE INDEX IF NOT EXISTS idx_words_book ON words(book_id);
CREATE INDEX IF NOT EXISTS idx_progress_due ON progress(next_due);
-- 每次答题的流水，用于学习统计
CREATE TABLE IF NOT EXISTS review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  is_new INTEGER DEFAULT 0,
  ts TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_review_log_ts ON review_log(ts);
-- 卡牌图鉴与用户收集
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'N',
  flavor TEXT DEFAULT '',
  palette TEXT DEFAULT 'ink',
  hidden INTEGER DEFAULT 0,
  unlock_at INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS user_cards (
  card_id INTEGER NOT NULL REFERENCES cards(id),
  earned_at TEXT DEFAULT (datetime('now', 'localtime')),
  PRIMARY KEY (card_id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS schema_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  schema_version INTEGER NOT NULL
);
INSERT OR IGNORE INTO schema_meta (id, schema_version) VALUES (1, 0);
`);

function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(row => row.name === column);
}

function ensureColumn(table, column, definition) {
  if (!hasColumn(table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

const migrations = [
  {
    version: 1,
    name: 'book study plans',
    up() {
      ensureColumn('wordbooks', 'daily_new', 'INTEGER DEFAULT 15');
      ensureColumn('wordbooks', 'daily_review', 'INTEGER DEFAULT 60');
      ensureColumn('wordbooks', 'target_date', 'TEXT');
      ensureColumn('wordbooks', 'plan_active', 'INTEGER DEFAULT 0');
    },
  },
  {
    version: 2,
    name: 'first study date',
    up() {
      ensureColumn('progress', 'first_studied', 'TEXT');
    },
  },
  {
    version: 3,
    name: 'idempotent review events and outcomes',
    up() {
      ensureColumn('review_log', 'request_id', 'TEXT');
      ensureColumn('review_log', 'outcome', "TEXT CHECK (outcome IS NULL OR outcome IN ('first_correct', 'retry_correct', 'wrong', 'abandoned'))");
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_review_log_request_id ON review_log(request_id) WHERE request_id IS NOT NULL');
    },
  },
  {
    version: 4,
    name: 'daily card claims',
    up() {
      db.exec(`CREATE TABLE IF NOT EXISTS card_draws (
        day TEXT PRIMARY KEY,
        card_id INTEGER REFERENCES cards(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      )`);
    },
  },
  {
    version: 5,
    name: 'study round and request payload identity',
    up() {
      ensureColumn('review_log', 'session_id', 'TEXT');
      ensureColumn('review_log', 'request_payload', 'TEXT');
      db.exec('CREATE INDEX IF NOT EXISTS idx_review_log_session_word ON review_log(session_id, word_id, id)');
    },
  },
];

for (const migration of migrations) {
  const currentVersion = db.prepare('SELECT schema_version FROM schema_meta WHERE id = 1').get().schema_version;
  if (currentVersion >= migration.version) continue;
  db.exec('BEGIN IMMEDIATE');
  try {
    migration.up();
    db.prepare('UPDATE schema_meta SET schema_version = ? WHERE id = 1').run(migration.version);
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    error.message = `Database migration ${migration.version} (${migration.name}) failed: ${error.message}`;
    throw error;
  }
}

function getSchemaVersion() {
  return db.prepare('SELECT schema_version FROM schema_meta WHERE id = 1').get().schema_version;
}

// ---- 词表解析：行格式 "word [phonetic] pos. meaning" ----
function parseLine(line) {
  line = line.trim();
  if (!line) return null;
  const m = line.match(/^(.+?)\s*(?:\[([^\]]*)\])?\s+([a-z./&]+\.?)\s*[.:．]?\s*(.+)$/i);
  if (!m) return null;
  let [, word, phonetic, pos, meaning] = m;
  word = word.trim().replace(/^\*+/, ''); // 去掉英专词表的星级标记
  // 跳过章节标题行（如单独的 "A"）和纯中文行
  if (/^[A-Z]$/.test(word)) return null;
  if (/[一-龥]/.test(word)) return null;
  meaning = meaning.replace(/[\s ]+$/g, '').trim();
  if (!meaning || !/[一-龥]/.test(meaning)) return null;
  return { word, phonetic: (phonetic || '').trim(), pos: pos.trim(), meaning };
}

// ---- 批量导入解析：支持以下行格式 ----
//   word [音标] 词性. 释义      （标准词表格式）
//   word 词性. 释义             （无音标）
//   word<TAB>词性<TAB>释义      （制表符）
//   word,词性,释义 / word,释义  （CSV 风格）
function parseImportLine(line) {
  line = line.trim();
  if (!line) return null;
  const std = parseLine(line);
  if (std) return std;
  // 制表符 / CSV
  const parts = line.split(/\t|,|，/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2 && !/[一-龥]/.test(parts[0])) {
    const [word, a, b] = parts;
    if (parts.length >= 3 && /^[a-z./&]+\.?$/i.test(a)) return { word, phonetic: '', pos: a, meaning: b };
    return { word, phonetic: '', pos: '', meaning: parts.slice(1).join('，') };
  }
  // word 释义（空格分隔，释义含中文）
  const m = line.match(/^([A-Za-z][A-Za-z\-' ]*?)\s+(.+[一-龥].*)$/);
  if (m) return { word: m[1].trim(), phonetic: '', pos: '', meaning: m[2].trim() };
  return null;
}

function seedBook(name, description, file, limit) {
  const exists = db.prepare('SELECT id FROM wordbooks WHERE name = ?').get(name);
  if (exists) return;
  const raw = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const insertBook = db.prepare('INSERT INTO wordbooks (name, description, is_builtin) VALUES (?, ?, 1)');
  const { lastInsertRowid: bookId } = insertBook.run(name, description);
  const insertWord = db.prepare('INSERT OR IGNORE INTO words (book_id, word, phonetic, pos, meaning) VALUES (?, ?, ?, ?, ?)');
  let count = 0;
  for (const line of raw.split(/\r?\n/)) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    insertWord.run(bookId, parsed.word, parsed.phonetic, parsed.pos, parsed.meaning);
    if (++count >= limit) break;
  }
  console.log(`[seed] ${name}: ${count} 词`);
}

function seed() {
  const seedDir = path.join(__dirname, 'seed');
  seedBook('中考核心词汇', '中考英语大纲词汇（约 1600 词）', path.join(seedDir, 'zhongkao.txt'), 1600);
  seedBook('四级核心词汇', '大学英语四级高频词（精选 800 词）', path.join(seedDir, 'cet4.txt'), 800);
  seedBook('六级核心词汇', '大学英语六级高频词（精选 600 词）', path.join(seedDir, 'cet6.txt'), 600);
  seedBook('考研大纲词汇', '考研英语大纲词汇（完整版，约 5500 词）', path.join(seedDir, 'npee.txt'), 5500);
  seedBook('英语专四专八词汇', '英语专业四八级词汇（约 12000 词）', path.join(seedDir, 'tem.txt'), 12000);
  seedCards();
}

// ---- 卡牌图鉴：每日完成学习计划可得一张；集满数量解锁卡包与隐藏卡 ----
function seedCards() {
  // 按 palette 去重，可增量加入新卡
  const ins = db.prepare('INSERT INTO cards (title, category, rarity, flavor, palette, hidden, unlock_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM cards WHERE palette = ?)');
  const update = db.prepare('UPDATE cards SET title = ?, category = ?, rarity = ?, flavor = ?, hidden = ?, unlock_at = ? WHERE palette = ?');
  const add = (c) => {
    ins.run(c[0], c[1], c[2], c[3], c[4], c[5] || 0, c[6] || 0, c[4]);
    // 保留原卡牌 ID 和用户收集记录，同时更新旧版卡牌文案。
    update.run(c[0], c[1], c[2], c[3], c[5] || 0, c[6] || 0, c[4]);
  };
  const normal = [
    // 历史
    ['丝绸之路', '历史', 'R', '驼铃穿过河西走廊，把东方的瓷器与西方的星辰缝在一起。', 'silk'],
    ['庞贝最后一夜', '历史', 'N', '维苏威火山在公元 79 年按下暂停键，面包还留在炉里。', 'pompeii'],
    ['大航海时代', '历史', 'SR', '麦哲伦的船队用三年证明：地球真的是圆的。', 'voyage'],
    ['活字与油墨', '历史', 'N', '毕昇的泥活字比古腾堡的印刷机早了四百年。', 'movable'],
    // 风景
    ['冰岛极光', '风景', 'SR', '太阳风跋涉一亿五千万公里，只为在极夜里跳一支舞。', 'aurora'],
    ['撒哈拉之晨', '风景', 'N', '每粒沙子都记得自己曾是海底的礁石。', 'sahara'],
    ['雾漫漓江', '风景', 'R', '山从水墨里浮出来，船从云的倒影里穿过去。', 'liriver'],
    ['安第斯云海', '风景', 'N', '在海拔四千米的地方，云是长在脚边的。', 'andes'],
    // 游戏
    ['像素勇者', '游戏', 'N', '8-bit 的世界里，勇气和血条一样都可以回满。', 'pixel'],
    ['存档点', '游戏', 'R', '人生虽然没有存档，但每天都可以是新周目。', 'savepoint'],
    ['荒城同行', '游戏', 'SR', '桥断了，两个人仍能互相借力走过去。', 'tlou'],
    ['方格重组', '游戏', 'N', '让纷乱的形状找到各自的位置。', 'tetris'],
    // 人文
    ['京都苔寺', '人文', 'R', '一百二十种苔藓，用五百年抄写同一部心经。', 'moss'],
    ['手冲咖啡学', '人文', 'N', '92°C 的水，四分钟的等待，一杯的专注。', 'coffee'],
    ['夜半小馆', '人文', 'N', '食物是最短的回家路。', 'diner'],
    ['图书馆避难所', '人文', 'SR', '博尔赫斯说：天堂应该是图书馆的模样。', 'library'],
    // 生物
    ['水熊虫不死身', '生物', 'SR', '真空、辐射、沸水——这种一毫米的生物全都扛过。', 'tardigrade'],
    ['灯塔水母', '生物', 'UR', '理论上永生：它能从成年形态退回幼体，再来一遍。', 'jellyfish'],
    ['蚁群智慧', '生物', 'N', '没有一只蚂蚁认识路，但整个蚁群从不迷路。', 'ant'],
    ['鲸落', '生物', 'R', '一头鲸沉入海底，可以养活一个生态系统一百年。', 'whalefall'],
    // 物理
    ['薛定谔的猫', '物理', 'SR', '打开盒子之前，猫既在又不在——量子力学如是说。', 'quantum'],
    ['引力波回响', '物理', 'UR', '十三亿年前两个黑洞相撞，2015 年地球才听到回声。', 'gravity'],
    ['熵增定律', '物理', 'R', '宇宙趋向混乱，所以整理房间是在对抗宇宙。', 'entropy'],
    ['光速不变', '物理', 'N', '无论你跑多快，光永远比你快三十万公里每秒。', 'lightspeed'],
  ];
  // ---- 第二批：游戏扩充 ----
  normal.push(
    ['风原之门', '游戏', 'SR', '向风敞开的石门后，是一条没人替你走过的路。', 'zelda'],
    ['碎星王座', '游戏', 'UR', '星光落在空王座上，等待新的故事。', 'eldenring'],
    ['折光实验室', '游戏', 'R', '换一个角度，眼前的墙也会变成路。', 'portal'],
    ['回旋之城', '游戏', 'R', '阶梯绕回原点，视角却已经不同。', 'monument'],
    ['雨后小农场', '游戏', 'N', '雨停之后，把一粒种子交给明天。', 'stardew'],
    ['竹影对决', '游戏', 'SR', '竹叶落地之前，胜负已在呼吸之间。', 'sekiro'],
    ['深穴微光', '游戏', 'SR', '小小的灯火，也足够照亮下一步。', 'hollowknight'],
    ['协作工坊', '游戏', 'N', '两个人一起，复杂的齿轮也能转起来。', 'ittakestwo'],
    ['霜岭同行', '游戏', 'SR', '越过最冷的山口，守护就是彼此的方向。', 'godofwar'],
    ['血月街巷', '游戏', 'UR', '红月升起时，老街的每扇窗都有秘密。', 'bloodborne'],
    ['霓虹夜航', '游戏', 'R', '末班电车穿过雨夜，把愿望送往城市另一端。', 'cyberpunk'],
    ['砂海同行', '游戏', 'SR', '在沙漠里相遇的人，会记得同一阵风。', 'journey'],
    ['长途信使', '游戏', 'SR', '路再远，也有人在等一件小小的包裹。', 'deathstranding'],
    ['雪境草药师', '游戏', 'R', '识得山间草木，才能照顾风雪中的旅人。', 'witcher'],
    ['地下花园', '游戏', 'R', '黑暗里也会开花，善意总能找到入口。', 'undertale'],
  );
  // ---- 第三批：抽象 & 冷知识扩充 ----
  normal.push(
    ['忒修斯之船', '哲学', 'SR', '换掉所有木板之后，它还是原来那艘船吗？', 'theseus'],
    ['缸中之脑', '哲学', 'UR', '你如何确定此刻不是一场被输入的梦境？', 'brainvat'],
    ['西西弗斯', '哲学', 'R', '加缪说：登上顶峰的斗争本身，足以充实人心。', 'sisyphus'],
    ['庄周梦蝶', '哲学', 'SR', '不知周之梦为胡蝶与，胡蝶之梦为周与？', 'butterflydream'],
    ['莫比乌斯环', '数学', 'R', '只有一个面的环——蚂蚁能不翻越边缘走遍全部。', 'mobius'],
    ['克莱因瓶', '数学', 'UR', '没有内外之分的瓶子，永远装不满。', 'klein'],
    ['哥德尔不完备', '数学', 'SR', '任何足够强的系统里，都有永远无法证明的真理。', 'godel'],
    ['黄金分割', '数学', 'N', '0.618，从鹦鹉螺到帕特农神庙的隐藏比例。', 'goldenratio'],
    ['图灵测试', '科学', 'R', '如果分辨不出对面是不是人，它就算会思考吗？', 'turing'],
    ['费米悖论', '科学', 'SR', '宇宙这么大，他们都在哪儿呢？', 'fermi'],
    ['奥伯斯佯谬', '科学', 'N', '如果宇宙无限且永恒，夜空为什么不是亮的？', 'olbers'],
    ['混沌蝴蝶', '科学', 'R', '巴西的蝴蝶扇动翅膀，得州可能掀起龙卷风。', 'butterflyfx'],
    ['沙漠星图', '天文', 'SR', '把漫天星斗带回桌前，夜空便有了可以重读的形状。', 'dunhuang'],
    ['创生之柱', '天文', 'UR', '鹰星云里几根六光年高的尘埃柱，正在孕育恒星。', 'pillars'],
    ['暗淡蓝点', '天文', 'SR', '64 亿公里外回望，地球只是悬浮在阳光里的一粒尘埃。', 'paleblue'],
    ['月亮的错觉', '天文', 'N', '地平线上的月亮显得更大——但它其实没有变。', 'moonillusion'],
    ['云间绸舞', '艺术', 'SR', '丝带跟着风走，舞姿便留在了云上。', 'feitian'],
    ['夜色星河', '艺术', 'R', '山村睡去之后，天空仍有自己的光。', 'starrynight'],
    ['潮汐之脊', '艺术', 'R', '浪花抬起海面，也托住一艘归航的小船。', 'greatwave'],
    ['向阳花束', '艺术', 'N', '一束花把午后的阳光留在窗边。', 'sunflower'],
  );
  for (const c of normal) add(c);
  // 隐藏卡：集齐 unlock_at 张普通卡后随卡包解锁
  const hidden = [
    ['仰望星空', '物理', 'UR', '望远镜里藏着比脚下更辽阔的路。', 'hawking', 1, 10],
    ['河桥长卷', '历史', 'UR', '桥上人来人往，城的一天在水边展开。', 'qingming', 1, 20],
    ['星海留声', '人文', 'UR', '把一段问候送向远方，或许会被某颗星听见。', 'voyager', 1, 30],
  ];
  for (const c of hidden) add(c);
  console.log(`[seed] 卡牌图鉴: ${normal.length} 普通 + ${hidden.length} 隐藏`);
}

module.exports = { db, seed, parseImportLine, getSchemaVersion };
