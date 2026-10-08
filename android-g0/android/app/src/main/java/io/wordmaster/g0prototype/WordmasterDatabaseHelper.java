package io.wordmaster.g0prototype;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import android.content.ContentValues;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Locale;

final class WordmasterDatabaseHelper extends SQLiteOpenHelper {
    static final String DATABASE_NAME = "wordmaster.db";
    private static final int DATABASE_VERSION = 3;
    private static final String SEED_DATABASE_ASSET = "wordmaster-seed.db";
    private final Context context;

    WordmasterDatabaseHelper(Context context) {
        super(context.getApplicationContext(), DATABASE_NAME, null, DATABASE_VERSION);
        this.context = context.getApplicationContext();
        ensureSeedDatabaseCopied(this.context);
    }

    @Override
    public void onConfigure(SQLiteDatabase database) {
        database.setForeignKeyConstraintsEnabled(true);
        database.setLocale(Locale.US);
    }

    @Override
    public void onCreate(SQLiteDatabase database) {
        try (InputStream input = context.getAssets().open("seed-schema-v1.sql")) {
            String sql = new String(readAll(input), java.nio.charset.StandardCharsets.UTF_8);
            for (String statement : sql.split(";")) {
                String trimmed = statement.trim();
                if (!trimmed.isEmpty()) database.execSQL(trimmed);
            }
        } catch (Exception error) {
            throw new IllegalStateException("本地数据库结构创建失败。", error);
        }
    }

    @Override
    public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            database.execSQL("ALTER TABLE review_log ADD COLUMN local_day TEXT NOT NULL DEFAULT '1970-01-01'");
            database.execSQL("ALTER TABLE review_log ADD COLUMN timezone_id TEXT NOT NULL DEFAULT 'legacy-unknown'");
            database.execSQL("UPDATE review_log SET local_day = substr(ts, 1, 10) WHERE local_day = '1970-01-01'");
            database.execSQL("CREATE INDEX IF NOT EXISTS idx_review_log_local_day ON review_log(local_day)");
        }
        if (oldVersion < 3) {
            database.execSQL("DROP INDEX IF EXISTS idx_review_log_local_day");
            database.execSQL("DROP INDEX IF EXISTS idx_review_log_session_word");
            database.execSQL("ALTER TABLE review_log RENAME TO review_log_g1_old");
            database.execSQL("CREATE TABLE review_log ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "word_key TEXT NOT NULL, "
                + "correct INTEGER NOT NULL CHECK (correct IN (0, 1)), "
                + "is_new INTEGER NOT NULL DEFAULT 0 CHECK (is_new IN (0, 1)), "
                + "ts TEXT NOT NULL, request_id TEXT NOT NULL UNIQUE, "
                + "outcome TEXT NOT NULL CHECK (outcome IN ('first_correct', 'retry_correct', 'wrong', 'abandoned')), "
                + "session_id TEXT NOT NULL, request_payload TEXT NOT NULL, "
                + "local_day TEXT NOT NULL, timezone_id TEXT NOT NULL)");
            database.execSQL("INSERT INTO review_log (id, word_key, correct, is_new, ts, request_id, outcome, session_id, request_payload, local_day, timezone_id) "
                + "SELECT id, word_key, correct, is_new, ts, request_id, outcome, session_id, request_payload, local_day, timezone_id FROM review_log_g1_old");
            database.execSQL("DROP TABLE review_log_g1_old");
            database.execSQL("CREATE INDEX idx_review_log_day ON review_log(ts)");
            database.execSQL("CREATE INDEX idx_review_log_session_word ON review_log(session_id, word_key, id)");
            database.execSQL("CREATE INDEX idx_review_log_local_day ON review_log(local_day)");
        }
    }

    @Override
    public void onDowngrade(SQLiteDatabase database, int oldVersion, int newVersion) {
        throw new IllegalStateException("不支持将本地数据库从 " + oldVersion + " 降级到 " + newVersion + "。");
    }

    private static void ensureSeedDatabaseCopied(Context context) {
        File target = context.getDatabasePath(DATABASE_NAME);
        if (target.exists()) return;
        File parent = target.getParentFile();
        if (parent == null || (!parent.exists() && !parent.mkdirs())) {
            throw new IllegalStateException("无法创建应用私有数据库目录。");
        }
        File temporary = new File(parent, DATABASE_NAME + ".seed.tmp");
        if (temporary.exists() && !temporary.delete()) {
            throw new IllegalStateException("无法清理未完成的本地种子文件。");
        }

        try {
            JSONObject manifest = readManifest(context);
            copyAndVerifySeedAsset(context, temporary, manifest);
            if (!temporary.renameTo(target)) {
                throw new IllegalStateException("无法将内置词库原子安装到本机。");
            }
        } catch (Exception error) {
            if (temporary.exists()) temporary.delete();
            if (error instanceof IllegalStateException) throw (IllegalStateException) error;
            throw new IllegalStateException("内置词库安装失败，可关闭后重试。", error);
        }
    }

    synchronized void synchronizeSeedBundle(SQLiteDatabase database) {
        File staging = new File(context.getDatabasePath(DATABASE_NAME).getParentFile(), "wordmaster-seed-update.db");
        boolean attached = false;
        try {
            JSONObject manifest = readManifest(context);
            String wantedBundleHash = manifest.getString("bundle_sha256");
            String currentBundleHash = scalarString(database, "SELECT value FROM app_meta WHERE key = 'seed_bundle_sha256'");
            if (wantedBundleHash.equalsIgnoreCase(currentBundleHash)) return;
            if (staging.exists() && !staging.delete()) throw new IllegalStateException("无法清理未完成的词库更新。");
            copyAndVerifySeedAsset(context, staging, manifest);
            database.execSQL("ATTACH DATABASE '" + staging.getAbsolutePath().replace("'", "''") + "' AS seed_bundle");
            attached = true;

            database.beginTransaction();
            try {
                verifyAttachedSeed(database, manifest);
                database.execSQL("INSERT OR IGNORE INTO wordbooks "
                    + "(book_key, legacy_id, name, description, is_builtin, daily_new, daily_review, target_date, plan_active, sort_order) "
                    + "SELECT book_key, legacy_id, name, description, is_builtin, daily_new, daily_review, target_date, plan_active, sort_order "
                    + "FROM seed_bundle.wordbooks");
                database.execSQL("UPDATE wordbooks SET "
                    + "name = (SELECT s.name FROM seed_bundle.wordbooks s WHERE s.book_key = wordbooks.book_key), "
                    + "description = (SELECT s.description FROM seed_bundle.wordbooks s WHERE s.book_key = wordbooks.book_key), "
                    + "sort_order = (SELECT s.sort_order FROM seed_bundle.wordbooks s WHERE s.book_key = wordbooks.book_key) "
                    + "WHERE is_builtin = 1 AND book_key IN (SELECT book_key FROM seed_bundle.wordbooks)");
                database.execSQL("INSERT OR IGNORE INTO words "
                    + "(word_key, legacy_id, book_key, word, phonetic, pos, meaning, example, seed_order) "
                    + "SELECT word_key, legacy_id, book_key, word, phonetic, pos, meaning, example, seed_order FROM seed_bundle.words");
                database.execSQL("INSERT OR IGNORE INTO cards "
                    + "(id, card_key, title, category, rarity, flavor, palette, hidden, unlock_at, asset_path) "
                    + "SELECT id, card_key, title, category, rarity, flavor, palette, hidden, unlock_at, asset_path FROM seed_bundle.cards");
                database.execSQL("UPDATE cards SET "
                    + "title = (SELECT s.title FROM seed_bundle.cards s WHERE s.card_key = cards.card_key), "
                    + "category = (SELECT s.category FROM seed_bundle.cards s WHERE s.card_key = cards.card_key), "
                    + "rarity = (SELECT s.rarity FROM seed_bundle.cards s WHERE s.card_key = cards.card_key), "
                    + "flavor = (SELECT s.flavor FROM seed_bundle.cards s WHERE s.card_key = cards.card_key), "
                    + "hidden = (SELECT s.hidden FROM seed_bundle.cards s WHERE s.card_key = cards.card_key), "
                    + "unlock_at = (SELECT s.unlock_at FROM seed_bundle.cards s WHERE s.card_key = cards.card_key), "
                    + "asset_path = (SELECT s.asset_path FROM seed_bundle.cards s WHERE s.card_key = cards.card_key) "
                    + "WHERE card_key IN (SELECT card_key FROM seed_bundle.cards)");
                String copyJson = scalarString(database, "SELECT value FROM seed_bundle.app_meta WHERE key = 'card_copy_json'");
                upsertMeta(database, "card_copy_json", copyJson);
                upsertMeta(database, "seed_bundle_sha256", wantedBundleHash);
                upsertMeta(database, "seed_bundle_version", String.valueOf(manifest.getInt("bundle_version")));
                database.delete("seed_import_state", null, null);
                database.execSQL("INSERT INTO seed_import_state (bundle_version, bundle_sha256, completed_at) "
                    + "VALUES (?, ?, datetime('now','localtime'))", new Object[]{manifest.getInt("bundle_version"), wantedBundleHash});
                database.setTransactionSuccessful();
            } finally {
                database.endTransaction();
            }
        } catch (Exception error) {
            if (error instanceof IllegalStateException) throw (IllegalStateException) error;
            throw new IllegalStateException("内置词库升级未完成；下次启动会安全重试。", error);
        } finally {
            if (attached) {
                try { database.execSQL("DETACH DATABASE seed_bundle"); } catch (RuntimeException ignored) {}
            }
            if (staging.exists()) staging.delete();
        }
    }

    private static void copyAndVerifySeedAsset(Context context, File destination, JSONObject manifest) throws Exception {
        try (InputStream input = context.getAssets().open(SEED_DATABASE_ASSET);
             FileOutputStream output = new FileOutputStream(destination)) {
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            output.flush();
            output.getFD().sync();
        }
        String expectedHash = manifest.getString("database_sha256");
        if (!expectedHash.equalsIgnoreCase(fileSha256(destination))) throw new IllegalStateException("内置词库文件校验失败。");
        verifySeedDatabase(destination, manifest);
    }

    private static void verifyAttachedSeed(SQLiteDatabase database, JSONObject manifest) throws org.json.JSONException {
        int books = manifest.getJSONObject("counts").getInt("wordbooks");
        int words = manifest.getJSONObject("counts").getInt("words");
        int cards = manifest.getJSONObject("counts").getInt("cards");
        if (scalar(database, "SELECT COUNT(*) FROM seed_bundle.wordbooks") != books
            || scalar(database, "SELECT COUNT(*) FROM seed_bundle.words") != words
            || scalar(database, "SELECT COUNT(*) FROM seed_bundle.cards") != cards) {
            throw new IllegalStateException("待更新词库计数与清单不一致。");
        }
    }

    private static void upsertMeta(SQLiteDatabase database, String key, String value) {
        ContentValues values = new ContentValues();
        values.put("value", value == null ? "" : value);
        int changed = database.update("app_meta", values, "key = ?", new String[]{key});
        if (changed == 0) {
            values.put("key", key);
            database.insertOrThrow("app_meta", null, values);
        }
    }

    private static JSONObject readManifest(Context context) throws Exception {
        try (InputStream input = context.getAssets().open("seed-manifest.json")) {
            return new JSONObject(new String(readAll(input), java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    private static void verifySeedDatabase(File file, JSONObject manifest) throws org.json.JSONException {
        SQLiteDatabase database = SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
        try {
            int booksExpected = manifest.getJSONObject("counts").getInt("wordbooks");
            int wordsExpected = manifest.getJSONObject("counts").getInt("words");
            int cardsExpected = manifest.getJSONObject("counts").getInt("cards");
            if (scalar(database, "PRAGMA user_version") != 1
                || scalar(database, "SELECT COUNT(*) FROM wordbooks") != booksExpected
                || scalar(database, "SELECT COUNT(*) FROM words") != wordsExpected
                || scalar(database, "SELECT COUNT(*) FROM cards") != cardsExpected
                || scalar(database, "SELECT COUNT(*) FROM progress") != 0
                || scalar(database, "SELECT COUNT(*) FROM review_log") != 0
                || scalar(database, "SELECT COUNT(*) FROM user_cards") != 0
                || scalar(database, "SELECT COUNT(*) FROM card_draws") != 0) {
                throw new IllegalStateException("内置词库数量或隐私边界校验失败。");
            }
            try (Cursor cursor = database.rawQuery("PRAGMA integrity_check", null)) {
                if (!cursor.moveToFirst() || !"ok".equals(cursor.getString(0))) {
                    throw new IllegalStateException("内置词库完整性校验失败。");
                }
            }
        } finally {
            database.close();
        }
    }

    private static int scalar(SQLiteDatabase database, String sql) {
        try (Cursor cursor = database.rawQuery(sql, null)) {
            if (!cursor.moveToFirst()) return -1;
            return cursor.getInt(0);
        }
    }

    private static String scalarString(SQLiteDatabase database, String sql) {
        try (Cursor cursor = database.rawQuery(sql, null)) {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        }
    }

    private static String fileSha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        StringBuilder result = new StringBuilder();
        for (byte value : digest.digest()) result.append(String.format(Locale.ROOT, "%02X", value));
        return result.toString();
    }

    private static byte[] readAll(InputStream input) throws Exception {
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        byte[] buffer = new byte[16 * 1024];
        int count;
        while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        return output.toByteArray();
    }
}
