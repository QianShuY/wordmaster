package io.wordmaster.g0prototype;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.getcapacitor.JSObject;

import java.util.Locale;
import java.util.UUID;

final class WordmasterStoreRepository implements AutoCloseable {
    static final String DATABASE_NAME = "wordmaster-g0-demo.db";
    static final String WORD_KEY = "demo:abandon";

    private final StoreOpenHelper helper;
    private final Runnable afterReviewLogInsert;

    WordmasterStoreRepository(Context context) {
        this(context, () -> {});
    }

    WordmasterStoreRepository(Context context, Runnable afterReviewLogInsert) {
        this.helper = new StoreOpenHelper(context);
        this.afterReviewLogInsert = afterReviewLogInsert;
    }

    JSObject getState() {
        try {
            JSObject state = readState(helper.getReadableDatabase());
            if (state == null) throw new StoreException("本地题目不存在。", "WORD_NOT_FOUND");
            return state;
        } catch (StoreException error) {
            throw error;
        } catch (RuntimeException error) {
            throw new StoreException("本地记录读取失败。", "STORAGE_READ_FAILED", error);
        }
    }

    JSObject submitAnswer(String wordKey, String requestId, String answerValue) {
        String answer = normalize(answerValue);
        if (!WORD_KEY.equals(wordKey) || requestId == null || requestId.length() > 128 || answer.isEmpty()) {
            throw new StoreException("题目或答案无效。", "INVALID_INPUT");
        }
        try {
            UUID.fromString(requestId);
        } catch (IllegalArgumentException error) {
            throw new StoreException("请求编号无效。", "INVALID_REQUEST_ID", error);
        }

        SQLiteDatabase database;
        try {
            database = helper.getWritableDatabase();
            database.beginTransaction();
        } catch (RuntimeException error) {
            throw new StoreException("本地数据库不可用，请重试。", "STORAGE_UNAVAILABLE", error);
        }

        JSObject result;
        try {
            String expected = readAnswer(database, wordKey);
            if (expected == null) throw new StoreException("本地题目不存在。", "WORD_NOT_FOUND");
            boolean correct = normalize(expected).equals(answer);
            ExistingRequest prior = readRequest(database, requestId);

            if (prior != null) {
                if (!prior.wordKey.equals(wordKey) || !prior.answer.equals(answer)) {
                    throw new StoreException("请求编号已用于不同答案。", "REQUEST_CONFLICT");
                }
                result = submission(prior.correct, true, readState(database));
            } else {
                // Read all state needed for the update before changing either table.
                JSObject before = readState(database);
                ContentValues event = new ContentValues();
                event.put("request_id", requestId);
                event.put("word_key", wordKey);
                event.put("answer", answer);
                event.put("correct", correct ? 1 : 0);
                event.put("created_at", System.currentTimeMillis());
                database.insertOrThrow("review_log", null, event);

                // This no-op in production is an instrumentation test seam for rollback.
                afterReviewLogInsert.run();

                ContentValues progress = new ContentValues();
                progress.put("word_key", wordKey);
                progress.put("attempts", before.getInteger("attempts") + 1);
                progress.put("correct", before.getInteger("correct") + (correct ? 1 : 0));
                progress.put("updated_at", System.currentTimeMillis());
                database.insertWithOnConflict("progress", null, progress, SQLiteDatabase.CONFLICT_REPLACE);

                // Assemble every field that can fail before marking the transaction successful.
                result = submission(correct, false, readState(database));
            }
            database.setTransactionSuccessful();
        } catch (StoreException error) {
            throw error;
        } catch (RuntimeException error) {
            throw new StoreException("保存失败，请保留当前题目后重试。", "STORAGE_WRITE_FAILED", error);
        } finally {
            if (database.inTransaction()) database.endTransaction();
        }

        // endTransaction() committed before this result can reach the Capacitor bridge.
        return result;
    }

    private static JSObject submission(boolean correct, boolean duplicate, JSObject state) {
        JSObject result = new JSObject();
        result.put("correct", correct);
        result.put("duplicate", duplicate);
        result.put("state", state);
        return result;
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static String readAnswer(SQLiteDatabase database, String wordKey) {
        try (Cursor cursor = database.query("words", new String[]{"answer"}, "word_key = ?", new String[]{wordKey}, null, null, null)) {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        }
    }

    private static ExistingRequest readRequest(SQLiteDatabase database, String requestId) {
        try (Cursor cursor = database.query("review_log", new String[]{"word_key", "answer", "correct"}, "request_id = ?", new String[]{requestId}, null, null, null)) {
            if (!cursor.moveToFirst()) return null;
            return new ExistingRequest(cursor.getString(0), cursor.getString(1), cursor.getInt(2) == 1);
        }
    }

    private static JSObject readState(SQLiteDatabase database) {
        String prompt;
        try (Cursor cursor = database.query("words", new String[]{"prompt"}, "word_key = ?", new String[]{WORD_KEY}, null, null, null)) {
            if (!cursor.moveToFirst()) return null;
            prompt = cursor.getString(0);
        }
        int attempts = 0;
        int correct = 0;
        try (Cursor cursor = database.query("progress", new String[]{"attempts", "correct"}, "word_key = ?", new String[]{WORD_KEY}, null, null, null)) {
            if (cursor.moveToFirst()) {
                attempts = cursor.getInt(0);
                correct = cursor.getInt(1);
            }
        }
        JSObject state = new JSObject();
        state.put("wordKey", WORD_KEY);
        state.put("prompt", prompt);
        state.put("attempts", attempts);
        state.put("correct", correct);
        return state;
    }

    @Override
    public void close() {
        helper.close();
    }

    static final class StoreException extends RuntimeException {
        final String code;

        StoreException(String message, String code) {
            super(message);
            this.code = code;
        }

        StoreException(String message, String code, Throwable cause) {
            super(message, cause);
            this.code = code;
        }
    }

    private static final class ExistingRequest {
        final String wordKey;
        final String answer;
        final boolean correct;

        ExistingRequest(String wordKey, String answer, boolean correct) {
            this.wordKey = wordKey;
            this.answer = answer;
            this.correct = correct;
        }
    }

    private static final class StoreOpenHelper extends SQLiteOpenHelper {
        private static final int DATABASE_VERSION = 1;

        StoreOpenHelper(Context context) {
            super(context, DATABASE_NAME, null, DATABASE_VERSION);
        }

        @Override
        public void onConfigure(SQLiteDatabase database) {
            database.setForeignKeyConstraintsEnabled(true);
        }

        @Override
        public void onCreate(SQLiteDatabase database) {
            database.execSQL("CREATE TABLE words (word_key TEXT PRIMARY KEY, answer TEXT NOT NULL, prompt TEXT NOT NULL)");
            database.execSQL("CREATE TABLE progress (word_key TEXT PRIMARY KEY REFERENCES words(word_key), attempts INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, updated_at INTEGER)");
            database.execSQL("CREATE TABLE review_log (request_id TEXT PRIMARY KEY, word_key TEXT NOT NULL REFERENCES words(word_key), answer TEXT NOT NULL, correct INTEGER NOT NULL, created_at INTEGER NOT NULL)");
            ContentValues word = new ContentValues();
            word.put("word_key", WORD_KEY);
            word.put("answer", "abandon");
            word.put("prompt", "离开；抛弃；放弃");
            database.insertOrThrow("words", null, word);
        }

        @Override
        public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
            throw new IllegalStateException("G0 prototype schema migrations are not defined");
        }
    }
}
