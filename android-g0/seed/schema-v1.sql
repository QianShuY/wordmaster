PRAGMA foreign_keys = ON;

CREATE TABLE app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE wordbooks (
  book_key TEXT PRIMARY KEY,
  legacy_id INTEGER,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_builtin INTEGER NOT NULL DEFAULT 0 CHECK (is_builtin IN (0, 1)),
  daily_new INTEGER NOT NULL DEFAULT 15,
  daily_review INTEGER NOT NULL DEFAULT 60,
  target_date TEXT,
  plan_active INTEGER NOT NULL DEFAULT 0 CHECK (plan_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE words (
  word_key TEXT PRIMARY KEY,
  legacy_id INTEGER,
  book_key TEXT NOT NULL REFERENCES wordbooks(book_key) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT NOT NULL DEFAULT '',
  pos TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  seed_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(book_key, word)
);

CREATE TABLE progress (
  word_key TEXT PRIMARY KEY REFERENCES words(word_key) ON DELETE CASCADE,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_review TEXT,
  next_due TEXT,
  first_studied TEXT
);

CREATE TABLE review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_key TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  is_new INTEGER NOT NULL DEFAULT 0 CHECK (is_new IN (0, 1)),
  ts TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  outcome TEXT NOT NULL CHECK (outcome IN ('first_correct', 'retry_correct', 'wrong', 'abandoned')),
  session_id TEXT NOT NULL,
  request_payload TEXT NOT NULL
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  card_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'N',
  flavor TEXT NOT NULL DEFAULT '',
  palette TEXT NOT NULL UNIQUE,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  unlock_at INTEGER NOT NULL DEFAULT 0,
  asset_path TEXT NOT NULL
);

CREATE TABLE user_cards (
  card_id INTEGER PRIMARY KEY REFERENCES cards(id),
  earned_at TEXT NOT NULL
);

CREATE TABLE card_draws (
  day TEXT PRIMARY KEY,
  card_id INTEGER REFERENCES cards(id),
  created_at TEXT NOT NULL
);

CREATE TABLE seed_import_state (
  bundle_version INTEGER NOT NULL,
  bundle_sha256 TEXT NOT NULL,
  completed_at TEXT NOT NULL
);

CREATE INDEX idx_words_book_seed_order ON words(book_key, seed_order);
CREATE INDEX idx_progress_due ON progress(next_due);
CREATE INDEX idx_review_log_day ON review_log(ts);
CREATE INDEX idx_review_log_session_word ON review_log(session_id, word_key, id);
CREATE INDEX idx_cards_pool ON cards(hidden, unlock_at, id);

INSERT INTO seed_import_state (bundle_version, bundle_sha256, completed_at)
VALUES (1, 'pending', '2000-01-01 00:00:00');
