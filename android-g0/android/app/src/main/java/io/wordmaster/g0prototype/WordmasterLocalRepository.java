package io.wordmaster.g0prototype;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;

final class WordmasterLocalRepository implements AutoCloseable {
    static final String DATABASE_NAME = WordmasterDatabaseHelper.DATABASE_NAME;
    static final String DEFAULT_BOOK_KEY = "builtin:zhongkao";
    static final String DEFAULT_WORD_KEY = "builtin:zhongkao:entry:000002";
    private static final int CARD_DRAW_TARGET = 10;
    private static final int[] RARITY_WEIGHTS = { 50, 30, 15, 5 };

    interface TimeSource {
        long nowMillis();
        TimeZone timeZone();
    }

    interface RandomSource {
        double nextDouble();
    }

    private final WordmasterDatabaseHelper helper;
    private final TimeSource timeSource;
    private final RandomSource randomSource;
    private final Runnable afterReviewLogInsert;
    private final Runnable afterCardInsert;

    WordmasterLocalRepository(Context context) {
        this(context, new TimeSource() {
            @Override public long nowMillis() { return System.currentTimeMillis(); }
            @Override public TimeZone timeZone() { return TimeZone.getDefault(); }
        }, Math::random, () -> {}, () -> {});
    }

    WordmasterLocalRepository(Context context, Runnable afterReviewLogInsert) {
        this(context, new TimeSource() {
            @Override public long nowMillis() { return System.currentTimeMillis(); }
            @Override public TimeZone timeZone() { return TimeZone.getDefault(); }
        }, Math::random, afterReviewLogInsert, () -> {});
    }

    WordmasterLocalRepository(Context context, TimeSource timeSource, RandomSource randomSource,
                              Runnable afterReviewLogInsert, Runnable afterCardInsert) {
        this.helper = new WordmasterDatabaseHelper(context);
        this.timeSource = timeSource;
        this.randomSource = randomSource;
        this.afterReviewLogInsert = afterReviewLogInsert;
        this.afterCardInsert = afterCardInsert;
    }

    JSObject getState() {
        SQLiteDatabase database = writable();
        JSObject state = readWordState(database, DEFAULT_WORD_KEY);
        if (state == null) throw new StoreException("本地词条不存在。", "WORD_NOT_FOUND");
        return state;
    }

    JSONArray listBooks() {
        SQLiteDatabase database = writable();
        JSONArray result = new JSONArray();
        String now = localDateTime();
        String day = localDay();
        try (Cursor cursor = database.rawQuery("SELECT * FROM wordbooks ORDER BY is_builtin DESC, sort_order, book_key", null)) {
            while (cursor.moveToNext()) {
                String bookKey = cursor.getString(cursor.getColumnIndexOrThrow("book_key"));
                JSONObject book = new JSONObject();
                book.put("book_key", bookKey);
                int legacyIdIndex = cursor.getColumnIndexOrThrow("legacy_id");
                book.put("legacy_id", cursor.isNull(legacyIdIndex) ? JSONObject.NULL : cursor.getLong(legacyIdIndex));
                book.put("name", cursor.getString(cursor.getColumnIndexOrThrow("name")));
                book.put("description", cursor.getString(cursor.getColumnIndexOrThrow("description")));
                book.put("is_builtin", cursor.getInt(cursor.getColumnIndexOrThrow("is_builtin")));
                book.put("daily_new", cursor.getInt(cursor.getColumnIndexOrThrow("daily_new")));
                book.put("daily_review", cursor.getInt(cursor.getColumnIndexOrThrow("daily_review")));
                book.put("target_date", cursor.isNull(cursor.getColumnIndexOrThrow("target_date")) ? JSONObject.NULL : cursor.getString(cursor.getColumnIndexOrThrow("target_date")));
                book.put("plan_active", cursor.getInt(cursor.getColumnIndexOrThrow("plan_active")) == 1);
                book.put("word_count", scalar(database, "SELECT COUNT(*) FROM words WHERE book_key = ?", bookKey));
                book.put("mastered", scalar(database, "SELECT COUNT(*) FROM words w JOIN progress p USING(word_key) WHERE w.book_key = ? AND p.streak >= 3", bookKey));
                book.put("due_review", scalar(database, "SELECT COUNT(*) FROM words w JOIN progress p USING(word_key) WHERE w.book_key = ? AND p.next_due IS NOT NULL AND p.next_due <= ?", bookKey, now));
                book.put("new_today", scalar(database, "SELECT COUNT(*) FROM words w JOIN progress p USING(word_key) WHERE w.book_key = ? AND substr(p.first_studied, 1, 10) = ?", bookKey, day));
                book.put("mistakes", scalar(database, "SELECT COUNT(*) FROM words w JOIN progress p USING(word_key) WHERE w.book_key = ? AND p.wrong > 0 AND p.streak < 3", bookKey));
                int remaining = scalar(database, "SELECT COUNT(*) FROM words w LEFT JOIN progress p USING(word_key) WHERE w.book_key = ? AND p.word_key IS NULL", bookKey);
                book.put("plan", calculatePlan(remaining,
                    cursor.getInt(cursor.getColumnIndexOrThrow("daily_new")),
                    cursor.getInt(cursor.getColumnIndexOrThrow("plan_active")) == 1,
                    cursor.isNull(cursor.getColumnIndexOrThrow("target_date")) ? null : cursor.getString(cursor.getColumnIndexOrThrow("target_date"))));
                result.put(book);
            }
        } catch (JSONException error) {
            throw new StoreException("本地词库读取失败。", "STORAGE_READ_FAILED", error);
        }
        return result;
    }

    JSONArray listWords(String bookKey) {
        SQLiteDatabase database = writable();
        if (readBook(database, bookKey) == null) throw new StoreException("词库不存在。", "BOOK_NOT_FOUND");
        JSONArray words = new JSONArray();
        try (Cursor cursor = database.rawQuery("SELECT * FROM words WHERE book_key = ? ORDER BY word", new String[]{bookKey})) {
            while (cursor.moveToNext()) {
                JSONObject word = wordObject(cursor);
                int legacyIndex = cursor.getColumnIndexOrThrow("legacy_id");
                word.put("id", cursor.isNull(legacyIndex) ? JSONObject.NULL : cursor.getLong(legacyIndex));
                word.put("book_id", bookLegacyId(database, bookKey));
                words.put(word);
            }
        } catch (JSONException error) {
            throw new StoreException("词库单词读取失败。", "STORAGE_READ_FAILED", error);
        }
        return words;
    }

    JSObject createBook(String name, String description) {
        if (name == null || name.trim().isEmpty()) throw new StoreException("词库名称不能为空。", "INVALID_ARGUMENT");
        SQLiteDatabase database = writable();
        String bookKey = "user:" + UUID.randomUUID();
        long legacyId = nextLegacyId(database, "wordbooks", "legacy_id", "legacy_book_id_counter");
        ContentValues values = new ContentValues();
        values.put("book_key", bookKey);
        values.put("legacy_id", legacyId);
        values.put("name", name.trim());
        values.put("description", description == null ? "" : description.trim());
        values.put("is_builtin", 0);
        values.put("daily_new", 15);
        values.put("daily_review", 60);
        values.put("plan_active", 0);
        values.put("sort_order", (int) legacyId);
        database.insertOrThrow("wordbooks", null, values);
        JSObject result = new JSObject();
        result.put("id", legacyId);
        result.put("book_key", bookKey);
        return result;
    }

    JSObject deleteBook(String bookKey) {
        SQLiteDatabase database = writable();
        JSONObject book = readBook(database, bookKey);
        if (book == null || book.optBoolean("is_builtin")) throw new StoreException("内置词库不可删除，或词库不存在。", "INVALID_ARGUMENT");
        database.delete("wordbooks", "book_key = ? AND is_builtin = 0", new String[]{bookKey});
        JSObject result = new JSObject();
        result.put("ok", true);
        return result;
    }

    JSObject addWord(String bookKey, String word, String phonetic, String pos, String meaning, String example) {
        if (word == null || word.trim().isEmpty() || meaning == null || meaning.trim().isEmpty()) {
            throw new StoreException("单词和释义必填。", "INVALID_ARGUMENT");
        }
        SQLiteDatabase database = writable();
        if (readBook(database, bookKey) == null) throw new StoreException("词库不存在。", "BOOK_NOT_FOUND");
        JSONObject inserted = insertUserWord(database, bookKey, word, phonetic, pos, meaning, example);
        JSObject result = new JSObject();
        result.put("id", inserted.optLong("legacy_id"));
        result.put("word_key", inserted.optString("word_key"));
        return result;
    }

    JSObject importWords(String bookKey, JSONArray entries) {
        SQLiteDatabase database = writable();
        if (readBook(database, bookKey) == null) throw new StoreException("词库不存在。", "BOOK_NOT_FOUND");
        int added = 0;
        int duplicate = 0;
        database.beginTransaction();
        try {
            for (int i = 0; i < entries.length(); i++) {
                JSONObject entry = entries.optJSONObject(i);
                if (entry == null || entry.optString("word").trim().isEmpty() || entry.optString("meaning").trim().isEmpty()) continue;
                try {
                    insertUserWord(database, bookKey, entry.optString("word"), entry.optString("phonetic"),
                        entry.optString("pos"), entry.optString("meaning"), entry.optString("example"));
                    added++;
                } catch (StoreException error) {
                    if ("DUPLICATE_WORD".equals(error.code)) duplicate++;
                    else throw error;
                }
            }
            database.setTransactionSuccessful();
        } catch (StoreException error) {
            throw error;
        } catch (RuntimeException error) {
            throw new StoreException("批量导入失败，请重试。", "STORAGE_WRITE_FAILED", error);
        } finally {
            if (database.inTransaction()) database.endTransaction();
        }
        JSObject result = new JSObject();
        result.put("added", added);
        result.put("dup", duplicate);
        result.put("bad", new JSONArray());
        result.put("bad_total", 0);
        return result;
    }

    JSObject updateWord(String wordKey, String word, String phonetic, String pos, String meaning, String example) {
        if (word == null || word.trim().isEmpty() || meaning == null || meaning.trim().isEmpty()) {
            throw new StoreException("单词和释义必填。", "INVALID_ARGUMENT");
        }
        SQLiteDatabase database = writable();
        ContentValues values = new ContentValues();
        values.put("word", word.trim());
        values.put("phonetic", phonetic == null ? "" : phonetic.trim());
        values.put("pos", pos == null ? "" : pos.trim());
        values.put("meaning", meaning.trim());
        values.put("example", example == null ? "" : example.trim());
        try {
            int changed = database.update("words", values, "word_key = ?", new String[]{wordKey});
            if (changed == 0) throw new StoreException("单词不存在。", "WORD_NOT_FOUND");
        } catch (android.database.sqlite.SQLiteConstraintException error) {
            throw new StoreException("该单词已存在于此词库。", "DUPLICATE_WORD", error);
        }
        JSObject result = new JSObject();
        result.put("ok", true);
        return result;
    }

    JSObject deleteWord(String wordKey) {
        writable().delete("words", "word_key = ?", new String[]{wordKey});
        JSObject result = new JSObject();
        result.put("ok", true);
        return result;
    }

    JSONArray getStudyQueue(String bookKey, String mode, boolean all, int requestedLimit) {
        if (!isSupportedMode(mode)) throw new StoreException("练习模式无效。", "INVALID_ARGUMENT");
        SQLiteDatabase database = writable();
        if (readBook(database, bookKey) == null) throw new StoreException("词库不存在。", "BOOK_NOT_FOUND");
        JSONArray result = new JSONArray();
        int remaining = scalar(database, "SELECT COUNT(*) FROM words w LEFT JOIN progress p USING(word_key) WHERE w.book_key = ? AND p.word_key IS NULL", bookKey);
        JSONObject book = readBook(database, bookKey);
        JSONObject plan = calculatePlan(remaining, book.optInt("daily_new", 15), book.optBoolean("plan_active"), nullableString(book, "target_date"));
        int newToday = scalar(database, "SELECT COUNT(*) FROM words w JOIN progress p USING(word_key) WHERE w.book_key = ? AND substr(p.first_studied, 1, 10) = ?", bookKey, localDay());

        int[] limits = WordmasterStudyRules.studyQueueLimits(mode, plan.optInt("daily_quota"), newToday, all, requestedLimit);
        if ("learn".equals(mode)) {
            appendWords(database, result, bookKey, "new", limits[1], mode);
            return result;
        }

        appendWords(database, result, bookKey, "due", limits[0], mode);
        appendWords(database, result, bookKey, "new", limits[1], mode);
        return result;
    }

    JSObject submitAnswer(String wordKey, String requestId, String answer, String mode,
                          String sessionId, boolean isNew, String requestedOutcome) {
        return submitAnswer(wordKey, requestId, answer, mode, sessionId, isNew, requestedOutcome, null);
    }

    JSObject submitAnswer(String wordKey, String requestId, String answer, String mode,
                          String sessionId, boolean isNew, String requestedOutcome, String expectedWordOverride) {
        if (!isSupportedJudgement(mode) || wordKey == null || requestId == null || requestId.length() < 8
            || requestId.length() > 128 || sessionId == null || sessionId.length() < 8 || sessionId.length() > 128
            || answer == null || (answer.trim().isEmpty() && !"abandoned".equals(requestedOutcome))) {
            throw new StoreException("题目、答案或请求编号无效。", "INVALID_ARGUMENT");
        }
        if (!isValidOutcomeForRequest(requestedOutcome)) throw new StoreException("答题结果类型无效。", "INVALID_ARGUMENT");

        SQLiteDatabase database = writable();
        JSObject result;
        database.beginTransaction();
        try {
            JSONObject word = readWord(database, wordKey);
            if (word == null) throw new StoreException("本地词条不存在。", "WORD_NOT_FOUND");
            String expectedWord = expectedWordOverride == null || expectedWordOverride.isEmpty()
                ? word.optString("word") : expectedWordOverride;
            Boolean judgement = WordmasterStudyRules.judge(mode, answer,
                expectedWord, word.optString("meaning"), word.optString("pos"));
            if (judgement == null) throw new StoreException("此词条暂不支持该判定。", "UNSUPPORTED_JUDGEMENT");
            boolean correct = !"abandoned".equals(requestedOutcome) && judgement;
            if (requestedOutcome != null && !requestedOutcome.isEmpty()
                && (correct ? !("first_correct".equals(requestedOutcome) || "retry_correct".equals(requestedOutcome))
                    : !("wrong".equals(requestedOutcome) || "abandoned".equals(requestedOutcome)))) {
                throw new StoreException("答题结果类型与判定不一致。", "INVALID_ARGUMENT");
            }
            String normalizedAnswer = "spelling".equals(mode) ? WordmasterStudyRules.normalizeSpellingAnswer(answer) : answer;
            boolean normalizedIsNew = isNew;
            String normalizedOutcome = requestedOutcome == null || requestedOutcome.isEmpty()
                ? (correct ? "first_correct" : "wrong") : requestedOutcome;
            String requestPayload = requestPayload(wordKey, mode, normalizedAnswer, expectedWord, correct, normalizedIsNew, sessionId, normalizedOutcome);

            ExistingRequest prior = readRequest(database, requestId);
            if (prior != null) {
                if (!prior.requestPayload.equals(requestPayload)) {
                    throw new StoreException("请求编号已用于不同的答题内容。", "REQUEST_CONFLICT");
                }
                result = submission(prior.correct, true, prior.outcome, readWordState(database, prior.wordKey));
            } else {
                JSONObject current = readProgress(database, wordKey);
                boolean hadReview = scalar(database, "SELECT COUNT(*) FROM review_log WHERE word_key = ?", wordKey) > 0;
                String firstStudied = current == null ? null : current.optString("first_studied", null);
                boolean firstStudiedToday = firstStudied != null && firstStudied.startsWith(localDay());
                boolean newFlag = (normalizedIsNew || firstStudiedToday) && !hadReview;
                String previousOutcome = lastOutcomeForSession(database, sessionId, wordKey);
                String savedOutcome;
                try {
                    savedOutcome = WordmasterStudyRules.classifyOutcome(correct,
                        "wrong".equals(previousOutcome) || "abandoned".equals(previousOutcome), normalizedOutcome);
                } catch (IllegalArgumentException error) {
                    throw new StoreException("答题结果类型无效。", "INVALID_ARGUMENT", error);
                }

                int streak = WordmasterStudyRules.nextStreak(current == null ? 0 : current.optInt("streak"), correct);
                String now = localDateTime();
                String nextDue = correct ? dateAfter(streak, Calendar.DAY_OF_MONTH) : dateAfter(10, Calendar.MINUTE);
                String today = localDay();
                String zone = timeSource.timeZone().getID();

                ContentValues event = new ContentValues();
                event.put("word_key", wordKey);
                event.put("correct", correct ? 1 : 0);
                event.put("is_new", newFlag ? 1 : 0);
                event.put("ts", now);
                event.put("request_id", requestId);
                event.put("outcome", savedOutcome);
                event.put("session_id", sessionId);
                event.put("request_payload", requestPayload);
                event.put("local_day", today);
                event.put("timezone_id", zone);
                database.insertOrThrow("review_log", null, event);
                afterReviewLogInsert.run();

                ContentValues progress = new ContentValues();
                progress.put("word_key", wordKey);
                progress.put("correct", correct ? 1 : 0);
                progress.put("wrong", correct ? 0 : 1);
                progress.put("streak", streak);
                progress.put("last_review", now);
                progress.put("next_due", nextDue);
                progress.put("first_studied", current == null || firstStudied == null ? now : firstStudied);
                database.insertWithOnConflict("progress", null, progress, SQLiteDatabase.CONFLICT_IGNORE);
                if (current != null) {
                    database.execSQL("UPDATE progress SET correct = correct + ?, wrong = wrong + ?, streak = ?, last_review = ?, next_due = ?, first_studied = COALESCE(first_studied, ?) WHERE word_key = ?",
                        new Object[]{correct ? 1 : 0, correct ? 0 : 1, streak, now, nextDue, now, wordKey});
                }
                result = submission(correct, false, savedOutcome, readWordState(database, wordKey));
            }
            database.setTransactionSuccessful();
        } catch (StoreException error) {
            throw error;
        } catch (RuntimeException error) {
            throw new StoreException("保存失败，请保留当前题目后重试。", "STORAGE_WRITE_FAILED", error);
        } finally {
            if (database.inTransaction()) database.endTransaction();
        }
        return result;
    }

    JSObject submitDefaultAnswer(String wordKey, String requestId, String answer) {
        return submitAnswer(wordKey, requestId, answer, "spelling", "session-default-android", true, null);
    }

    JSObject markLearned(String wordKey) {
        SQLiteDatabase database = writable();
        if (readWord(database, wordKey) == null) throw new StoreException("本地词条不存在。", "WORD_NOT_FOUND");
        String now = localDateTime();
        database.execSQL("INSERT INTO progress (word_key, correct, wrong, streak, last_review, next_due, first_studied) "
            + "VALUES (?, 0, 0, 0, ?, ?, ?) ON CONFLICT(word_key) DO NOTHING",
            new Object[]{wordKey, now, now, now});
        JSObject response = new JSObject();
        response.put("ok", true);
        return response;
    }

    JSONArray listMistakes(boolean studyQueue, String mode) {
        if (studyQueue && !isSupportedMode(mode)) throw new StoreException("练习模式无效。", "INVALID_ARGUMENT");
        SQLiteDatabase database = writable();
        JSONArray result = new JSONArray();
        String order = studyQueue ? "ORDER BY RANDOM() LIMIT 30" : "ORDER BY p.wrong DESC, p.last_review DESC";
        String sql = "SELECT w.*, b.name AS book_name, b.is_builtin AS book_is_builtin, p.wrong, p.streak, p.last_review "
            + "FROM progress p JOIN words w USING(word_key) JOIN wordbooks b USING(book_key) "
            + "WHERE p.wrong > 0 AND p.streak < 3 " + order;
        try (Cursor cursor = database.rawQuery(sql, null)) {
            while (cursor.moveToNext()) {
                JSONObject item = wordObject(cursor);
                item.put("book_name", cursor.getString(cursor.getColumnIndexOrThrow("book_name")));
                item.put("book_is_builtin", cursor.getInt(cursor.getColumnIndexOrThrow("book_is_builtin")));
                item.put("wrong", cursor.getInt(cursor.getColumnIndexOrThrow("wrong")));
                item.put("streak", cursor.getInt(cursor.getColumnIndexOrThrow("streak")));
                item.put("last_review", nullableString(cursor, "last_review"));
                if (studyQueue && "meaning".equals(mode)) item.put("choices", meaningChoices(database, item));
                result.put(item);
            }
        } catch (JSONException error) {
            throw new StoreException("错题读取失败。", "STORAGE_READ_FAILED", error);
        }
        return result;
    }

    JSObject clearMistake(String wordKey) {
        SQLiteDatabase database = writable();
        database.execSQL("UPDATE progress SET wrong = 0 WHERE word_key = ?", new Object[]{wordKey});
        JSObject response = new JSObject();
        response.put("ok", true);
        return response;
    }

    JSObject getGlobalStats() {
        SQLiteDatabase database = writable();
        JSObject stats = new JSObject();
        stats.put("total_words", scalar(database, "SELECT COUNT(*) FROM words"));
        stats.put("today_reviewed", scalar(database, "SELECT COUNT(*) FROM review_log WHERE local_day = ?", localDay()));
        stats.put("total_correct", scalar(database, "SELECT COALESCE(SUM(correct), 0) FROM progress"));
        stats.put("total_wrong", scalar(database, "SELECT COALESCE(SUM(wrong), 0) FROM progress"));
        stats.put("mastered", scalar(database, "SELECT COUNT(*) FROM progress WHERE streak >= 3"));
        return stats;
    }

    JSONArray getDailyStats(int requestedDays) {
        int days = Math.min(365, Math.max(1, requestedDays <= 0 ? 90 : requestedDays));
        String firstDay = dateOffset(-days);
        SQLiteDatabase database = writable();
        JSONArray rows = new JSONArray();
        try (Cursor cursor = database.rawQuery("SELECT local_day AS day, COUNT(*) AS total, SUM(correct) AS correct, SUM(is_new) AS new_words "
            + "FROM review_log WHERE local_day >= ? GROUP BY local_day ORDER BY local_day", new String[]{firstDay})) {
            while (cursor.moveToNext()) {
                JSONObject row = new JSONObject();
                row.put("day", cursor.getString(cursor.getColumnIndexOrThrow("day")));
                row.put("total", cursor.getInt(cursor.getColumnIndexOrThrow("total")));
                row.put("correct", cursor.getInt(cursor.getColumnIndexOrThrow("correct")));
                row.put("new_words", cursor.getInt(cursor.getColumnIndexOrThrow("new_words")));
                rows.put(row);
            }
        } catch (JSONException error) {
            throw new StoreException("学习统计读取失败。", "STORAGE_READ_FAILED", error);
        }
        return rows;
    }

    JSObject getOverview() {
        JSObject total = getGlobalStats();
        JSONArray books = listBooks();
        JSObject today = new JSObject();
        int dueReview = 0;
        int newToday = 0;
        int quota = 0;
        for (int i = 0; i < books.length(); i++) {
            JSONObject book = books.optJSONObject(i);
            dueReview += book == null ? 0 : book.optInt("due_review");
            newToday += book == null ? 0 : book.optInt("new_today");
            quota += book == null ? 0 : book.optJSONObject("plan").optInt("daily_quota");
        }
        today.put("due_review", dueReview);
        today.put("new_today", newToday);
        today.put("daily_new_quota", quota);
        JSObject overview = new JSObject();
        overview.put("streak", activeDayStreak(writable()));
        overview.put("today", today);
        overview.put("total", total);
        int answers = total.getInteger("total_correct") + total.getInteger("total_wrong");
        overview.put("accuracy", answers == 0 ? 0 : Math.round(total.getInteger("total_correct") * 100f / answers));
        return overview;
    }

    JSObject getCardCatalog() {
        SQLiteDatabase database = writable();
        JSONArray cards = new JSONArray();
        Map<Integer, String> owned = ownedCards(database);
        try (Cursor cursor = database.rawQuery("SELECT * FROM cards ORDER BY hidden, unlock_at, id", null)) {
            while (cursor.moveToNext()) {
                int id = cursor.getInt(cursor.getColumnIndexOrThrow("id"));
                boolean hidden = cursor.getInt(cursor.getColumnIndexOrThrow("hidden")) == 1;
                boolean isOwned = owned.containsKey(id);
                JSONObject card = cardObject(cursor);
                card.put("owned", isOwned);
                card.put("earned_at", isOwned ? owned.get(id) : JSONObject.NULL);
                if (hidden && !isOwned) {
                    card.put("title", "???");
                    card.put("flavor", "集齐更多卡牌后解锁");
                    card.put("palette", "locked");
                    card.put("asset_path", "");
                }
                cards.put(card);
            }
        } catch (JSONException error) {
            throw new StoreException("卡册读取失败。", "STORAGE_READ_FAILED", error);
        }
        JSObject result = new JSObject();
        result.put("cards", cards);
        result.put("owned", owned.size());
        result.put("drawn_today", drewToday(database));
        result.put("today_answered", scalar(database, "SELECT COUNT(*) FROM review_log WHERE local_day = ?", localDay()));
        result.put("draw_target", CARD_DRAW_TARGET);
        return result;
    }

    JSObject drawCard() {
        SQLiteDatabase database = writable();
        JSObject result;
        database.beginTransaction();
        try {
            if (drewToday(database)) throw new StoreException("今天已经抽过卡了，明天再来。", "ALREADY_DRAWN");
            int todayAnswered = scalar(database, "SELECT COUNT(*) FROM review_log WHERE local_day = ?", localDay());
            if (!WordmasterStudyRules.qualifiesForCard(todayAnswered, CARD_DRAW_TARGET)) throw new StoreException("先完成今天的学习（至少 10 次作答）再来抽卡。", "NOT_ELIGIBLE");

            Map<Integer, String> mine = ownedCards(database);
            List<JSONObject> pool = cardPool(database, false, mine);
            JSONObject card = pickWeightedCard(pool);
            if (card == null) {
                List<JSONObject> normals = cardPool(database, true, mine);
                JSONObject sample = pickUniform(normals);
                ContentValues claim = new ContentValues();
                claim.put("day", localDay());
                claim.putNull("card_id");
                claim.put("created_at", localDateTime());
                database.insertOrThrow("card_draws", null, claim);
                result = new JSObject();
                result.put("card", JSONObject.NULL);
                result.put("duplicate", true);
                result.put("message", "普通卡已全部集齐！今日好运转化为双倍墨香。");
                result.put("sample", sample == null ? JSONObject.NULL : sample);
            } else {
                int cardId = card.optInt("id");
                ContentValues earned = new ContentValues();
                earned.put("card_id", cardId);
                earned.put("earned_at", localDateTime());
                database.insertOrThrow("user_cards", null, earned);
                afterCardInsert.run();

                int ownedCount = mine.size() + 1;
                JSONArray unlocked = new JSONArray();
                List<JSONObject> hidden = lockedHiddenCards(database, mine);
                for (JSONObject candidate : hidden) {
                    if (candidate.optInt("hidden") == 1 && ownedCount >= candidate.optInt("unlock_at")) {
                        ContentValues hiddenEarned = new ContentValues();
                        hiddenEarned.put("card_id", candidate.optInt("id"));
                        hiddenEarned.put("earned_at", localDateTime());
                        database.insertOrThrow("user_cards", null, hiddenEarned);
                        unlocked.put(candidate);
                        ownedCount++;
                    }
                }
                ContentValues claim = new ContentValues();
                claim.put("day", localDay());
                claim.put("card_id", cardId);
                claim.put("created_at", localDateTime());
                database.insertOrThrow("card_draws", null, claim);
                result = new JSObject();
                result.put("card", card);
                result.put("unlocked", unlocked);
                result.put("owned", ownedCount);
                result.put("duplicate", false);
            }
            database.setTransactionSuccessful();
        } catch (StoreException error) {
            throw error;
        } catch (RuntimeException error) {
            throw new StoreException("抽卡失败，请重试。", "STORAGE_WRITE_FAILED", error);
        } finally {
            if (database.inTransaction()) database.endTransaction();
        }
        return result;
    }

    JSObject getAvailableCardCopy() {
        SQLiteDatabase database = writable();
        String serialized = scalarString(database, "SELECT value FROM app_meta WHERE key = 'card_copy_json'");
        if (serialized == null) throw new StoreException("卡牌文案缺失。", "STORAGE_READ_FAILED");
        try {
            JSONObject allCopy = new JSONObject(serialized);
            JSObject visible = new JSObject();
            try (Cursor cursor = database.rawQuery("SELECT c.palette FROM cards c LEFT JOIN user_cards u ON u.card_id = c.id WHERE c.hidden = 0 OR u.card_id IS NOT NULL", null)) {
                while (cursor.moveToNext()) {
                    String palette = cursor.getString(0);
                    if (allCopy.has(palette)) visible.put(palette, allCopy.get(palette));
                }
            }
            return visible;
        } catch (JSONException error) {
            throw new StoreException("卡牌文案读取失败。", "STORAGE_READ_FAILED", error);
        }
    }

    JSObject setPlan(String bookKey, String targetDate) {
        SQLiteDatabase database = writable();
        JSONObject book = readBook(database, bookKey);
        if (book == null) throw new StoreException("词库不存在。", "BOOK_NOT_FOUND");
        if (!isValidDay(targetDate)) throw new StoreException("目标日期格式应为 YYYY-MM-DD。", "INVALID_ARGUMENT");
        if (compareDays(targetDate, localDay()) < 0) throw new StoreException("目标日期不能早于今天。", "INVALID_ARGUMENT");
        ContentValues values = new ContentValues();
        values.put("target_date", targetDate);
        values.put("plan_active", 1);
        database.update("wordbooks", values, "book_key = ?", new String[]{bookKey});
        int remaining = scalar(database, "SELECT COUNT(*) FROM words w LEFT JOIN progress p USING(word_key) WHERE w.book_key = ? AND p.word_key IS NULL", bookKey);
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("plan", calculatePlan(remaining, book.optInt("daily_new", 15), true, targetDate));
        return result;
    }

    JSObject clearPlan(String bookKey) {
        writable().execSQL("UPDATE wordbooks SET plan_active = 0 WHERE book_key = ?", new Object[]{bookKey});
        JSObject result = new JSObject();
        result.put("ok", true);
        return result;
    }

    private void appendWords(SQLiteDatabase database, JSONArray result, String bookKey, String type, int limit, String mode) {
        if (limit <= 0) return;
        String query;
        String[] args;
        if ("due".equals(type)) {
            query = "SELECT w.*, p.streak, p.correct, p.wrong, 0 AS is_new FROM words w JOIN progress p USING(word_key) "
                + "WHERE w.book_key = ? AND p.next_due IS NOT NULL AND p.next_due <= ? ORDER BY p.next_due LIMIT ?";
            args = new String[]{bookKey, localDateTime(), String.valueOf(limit)};
        } else {
            query = "SELECT w.*, 0 AS streak, 0 AS correct, 0 AS wrong, 1 AS is_new FROM words w LEFT JOIN progress p USING(word_key) "
                + "WHERE w.book_key = ? AND p.word_key IS NULL ORDER BY RANDOM() LIMIT ?";
            args = new String[]{bookKey, String.valueOf(limit)};
        }
        try (Cursor cursor = database.rawQuery(query, args)) {
            while (cursor.moveToNext()) {
                JSONObject item = wordObject(cursor);
                item.put("streak", cursor.getInt(cursor.getColumnIndexOrThrow("streak")));
                item.put("correct", cursor.getInt(cursor.getColumnIndexOrThrow("correct")));
                item.put("wrong", cursor.getInt(cursor.getColumnIndexOrThrow("wrong")));
                item.put("is_new", cursor.getInt(cursor.getColumnIndexOrThrow("is_new")) == 1);
                if ("meaning".equals(mode)) item.put("choices", meaningChoices(database, item));
                result.put(item);
            }
        } catch (JSONException error) {
            throw new StoreException("学习队列读取失败。", "STORAGE_READ_FAILED", error);
        }
    }

    private JSONArray meaningChoices(SQLiteDatabase database, JSONObject word) throws JSONException {
        JSONArray choices = new JSONArray();
        List<String> values = new ArrayList<>();
        try (Cursor cursor = database.rawQuery("SELECT meaning FROM words WHERE book_key = ? AND word_key != ? AND meaning != '' ORDER BY RANDOM() LIMIT 3",
            new String[]{word.optString("book_key"), word.optString("word_key")})) {
            while (cursor.moveToNext()) values.add(cursor.getString(0));
        }
        values.add(word.optString("meaning"));
        for (int i = values.size() - 1; i > 0; i--) {
            int j = (int) Math.floor(clampRandom(randomSource.nextDouble()) * (i + 1));
            Collections.swap(values, i, j);
        }
        for (String value : values) choices.put(value);
        return choices;
    }

    private JSObject readWordState(SQLiteDatabase database, String wordKey) {
        JSONObject word = readWord(database, wordKey);
        if (word == null) return null;
        JSObject state = new JSObject();
        JSONObject progress = readProgress(database, wordKey);
        state.put("wordKey", wordKey);
        state.put("bookKey", word.optString("book_key"));
        state.put("bookName", bookName(database, word.optString("book_key")));
        state.put("word", word.optString("word"));
        state.put("prompt", word.optString("meaning"));
        state.put("phonetic", word.optString("phonetic"));
        state.put("pos", word.optString("pos"));
        state.put("attempts", scalar(database, "SELECT COUNT(*) FROM review_log WHERE word_key = ?", wordKey));
        state.put("correct", scalar(database, "SELECT COALESCE(SUM(correct), 0) FROM review_log WHERE word_key = ?", wordKey));
        state.put("streak", progress == null ? 0 : progress.optInt("streak"));
        state.put("isNew", progress == null);
        return state;
    }

    private JSONObject readWord(SQLiteDatabase database, String wordKey) {
        try (Cursor cursor = database.rawQuery("SELECT * FROM words WHERE word_key = ?", new String[]{wordKey})) {
            return cursor.moveToFirst() ? wordObject(cursor) : null;
        } catch (JSONException error) {
            throw new StoreException("词条读取失败。", "STORAGE_READ_FAILED", error);
        }
    }

    private JSONObject readBook(SQLiteDatabase database, String bookKey) {
        try (Cursor cursor = database.rawQuery("SELECT * FROM wordbooks WHERE book_key = ?", new String[]{bookKey})) {
            if (!cursor.moveToFirst()) return null;
            JSONObject book = new JSONObject();
            book.put("book_key", bookKey);
            book.put("legacy_id", cursor.isNull(cursor.getColumnIndexOrThrow("legacy_id")) ? JSONObject.NULL : cursor.getLong(cursor.getColumnIndexOrThrow("legacy_id")));
            book.put("name", cursor.getString(cursor.getColumnIndexOrThrow("name")));
            book.put("is_builtin", cursor.getInt(cursor.getColumnIndexOrThrow("is_builtin")) == 1);
            book.put("daily_new", cursor.getInt(cursor.getColumnIndexOrThrow("daily_new")));
            book.put("daily_review", cursor.getInt(cursor.getColumnIndexOrThrow("daily_review")));
            book.put("plan_active", cursor.getInt(cursor.getColumnIndexOrThrow("plan_active")) == 1);
            book.put("target_date", nullableString(cursor, "target_date"));
            return book;
        } catch (JSONException error) {
            throw new StoreException("词库读取失败。", "STORAGE_READ_FAILED", error);
        }
    }

    private JSONObject readProgress(SQLiteDatabase database, String wordKey) {
        try (Cursor cursor = database.rawQuery("SELECT * FROM progress WHERE word_key = ?", new String[]{wordKey})) {
            if (!cursor.moveToFirst()) return null;
            JSONObject progress = new JSONObject();
            progress.put("correct", cursor.getInt(cursor.getColumnIndexOrThrow("correct")));
            progress.put("wrong", cursor.getInt(cursor.getColumnIndexOrThrow("wrong")));
            progress.put("streak", cursor.getInt(cursor.getColumnIndexOrThrow("streak")));
            progress.put("first_studied", nullableString(cursor, "first_studied"));
            return progress;
        } catch (JSONException error) {
            throw new StoreException("学习记录读取失败。", "STORAGE_READ_FAILED", error);
        }
    }

    private ExistingRequest readRequest(SQLiteDatabase database, String requestId) {
        try (Cursor cursor = database.rawQuery("SELECT word_key, correct, outcome, request_payload FROM review_log WHERE request_id = ?", new String[]{requestId})) {
            if (!cursor.moveToFirst()) return null;
            return new ExistingRequest(cursor.getString(0), cursor.getInt(1) == 1, cursor.getString(2), cursor.getString(3));
        }
    }

    private String lastOutcomeForSession(SQLiteDatabase database, String sessionId, String wordKey) {
        try (Cursor cursor = database.rawQuery("SELECT outcome FROM review_log WHERE session_id = ? AND word_key = ? ORDER BY id DESC LIMIT 1",
            new String[]{sessionId, wordKey})) {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        }
    }

    private JSObject submission(boolean correct, boolean duplicate, String outcome, JSObject state) {
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("correct", correct);
        result.put("duplicate", duplicate);
        result.put("outcome", outcome);
        result.put("streak", state == null ? 0 : state.getInteger("streak"));
        result.put("state", state);
        return result;
    }

    private static String requestPayload(String wordKey, String mode, String answer, String expectedWord, boolean correct,
                                         boolean isNew, String sessionId, String outcome) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("word_key", wordKey);
            payload.put("mode", mode);
            payload.put("answer", answer);
            payload.put("expected_word", expectedWord);
            payload.put("correct", correct);
            payload.put("is_new", isNew);
            payload.put("session_id", sessionId);
            payload.put("outcome", outcome);
            return payload.toString();
        } catch (JSONException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    private static boolean isValidOutcomeForRequest(String outcome) {
        return outcome == null || outcome.isEmpty() || "first_correct".equals(outcome)
            || "retry_correct".equals(outcome) || "wrong".equals(outcome) || "abandoned".equals(outcome);
    }

    private static boolean isSupportedMode(String mode) {
        return "learn".equals(mode) || isSupportedJudgement(mode);
    }

    private static boolean isSupportedJudgement(String mode) {
        return "spelling".equals(mode) || "meaning".equals(mode) || "pos".equals(mode);
    }

    private JSONObject calculatePlan(int remaining, int dailyNew, boolean active, String targetDate) {
        JSONObject plan = new JSONObject();
        try {
            plan.put("active", active && targetDate != null);
            plan.put("remaining_new", Math.max(0, remaining));
            if (!active || targetDate == null) {
                plan.put("daily_quota", WordmasterStudyRules.dailyQuota(remaining, dailyNew, false, 1));
                plan.put("days_left", JSONObject.NULL);
            } else {
                long daysLeft = Math.max(1, dayOrdinal(targetDate) - dayOrdinal(localDay()) + 1);
                plan.put("daily_quota", WordmasterStudyRules.dailyQuota(remaining, dailyNew, true, (int) daysLeft));
                plan.put("days_left", daysLeft);
                plan.put("target_date", targetDate);
            }
        } catch (JSONException error) {
            throw new IllegalStateException(error);
        }
        return plan;
    }

    private int activeDayStreak(SQLiteDatabase database) {
        List<String> days = new ArrayList<>();
        try (Cursor cursor = database.rawQuery("SELECT DISTINCT local_day FROM review_log ORDER BY local_day DESC", null)) {
            while (cursor.moveToNext()) days.add(cursor.getString(0));
        }
        String cursorDay = localDay();
        if (!days.contains(cursorDay)) cursorDay = offsetDay(cursorDay, -1);
        int streak = 0;
        while (days.contains(cursorDay)) {
            streak++;
            cursorDay = offsetDay(cursorDay, -1);
        }
        return streak;
    }

    private Map<Integer, String> ownedCards(SQLiteDatabase database) {
        Map<Integer, String> owned = new HashMap<>();
        try (Cursor cursor = database.rawQuery("SELECT card_id, earned_at FROM user_cards", null)) {
            while (cursor.moveToNext()) owned.put(cursor.getInt(0), cursor.getString(1));
        }
        return owned;
    }

    private List<JSONObject> cardPool(SQLiteDatabase database, boolean includeOwned, Map<Integer, String> mine) {
        List<JSONObject> cards = new ArrayList<>();
        try {
            try (Cursor cursor = database.rawQuery("SELECT * FROM cards WHERE hidden = 0 ORDER BY id", null)) {
                while (cursor.moveToNext()) {
                    JSONObject card = cardObject(cursor);
                    if (includeOwned || !mine.containsKey(card.optInt("id"))) cards.add(card);
                }
            }
        } catch (JSONException error) {
            throw new StoreException("卡册读取失败。", "STORAGE_READ_FAILED", error);
        }
        return cards;
    }

    private List<JSONObject> lockedHiddenCards(SQLiteDatabase database, Map<Integer, String> mine) {
        List<JSONObject> cards = new ArrayList<>();
        try (Cursor cursor = database.rawQuery("SELECT * FROM cards WHERE hidden = 1 ORDER BY unlock_at, id", null)) {
            while (cursor.moveToNext()) {
                JSONObject card = cardObject(cursor);
                if (!mine.containsKey(card.optInt("id"))) cards.add(card);
            }
        } catch (JSONException error) {
            throw new StoreException("卡册读取失败。", "STORAGE_READ_FAILED", error);
        }
        return cards;
    }

    private JSONObject pickWeightedCard(List<JSONObject> cards) {
        if (cards.isEmpty()) return null;
        int[] weights = new int[cards.size()];
        for (int i = 0; i < cards.size(); i++) weights[i] = WordmasterStudyRules.cardWeight(cards.get(i).optString("rarity"));
        int index = WordmasterStudyRules.weightedCardIndex(weights, randomSource.nextDouble());
        return index < 0 ? null : cards.get(index);
    }

    private JSONObject pickUniform(List<JSONObject> cards) {
        if (cards.isEmpty()) return null;
        int index = (int) Math.floor(clampRandom(randomSource.nextDouble()) * cards.size());
        return cards.get(Math.min(index, cards.size() - 1));
    }

    private boolean drewToday(SQLiteDatabase database) {
        return scalar(database, "SELECT COUNT(*) FROM card_draws WHERE day = ?", localDay()) > 0
            || scalar(database, "SELECT COUNT(*) FROM user_cards WHERE substr(earned_at, 1, 10) = ?", localDay()) > 0;
    }

    private JSONObject cardObject(Cursor cursor) throws JSONException {
        JSONObject card = new JSONObject();
        card.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")));
        card.put("card_key", cursor.getString(cursor.getColumnIndexOrThrow("card_key")));
        card.put("title", cursor.getString(cursor.getColumnIndexOrThrow("title")));
        card.put("category", cursor.getString(cursor.getColumnIndexOrThrow("category")));
        card.put("rarity", cursor.getString(cursor.getColumnIndexOrThrow("rarity")));
        card.put("flavor", cursor.getString(cursor.getColumnIndexOrThrow("flavor")));
        card.put("palette", cursor.getString(cursor.getColumnIndexOrThrow("palette")));
        card.put("hidden", cursor.getInt(cursor.getColumnIndexOrThrow("hidden")) == 1);
        card.put("unlock_at", cursor.getInt(cursor.getColumnIndexOrThrow("unlock_at")));
        card.put("asset_path", cursor.getString(cursor.getColumnIndexOrThrow("asset_path")));
        return card;
    }

    private static JSONObject wordObject(Cursor cursor) throws JSONException {
        JSONObject word = new JSONObject();
        for (String key : new String[]{"word_key", "book_key", "word", "phonetic", "pos", "meaning", "example"}) {
            int index = cursor.getColumnIndex(key);
            if (index >= 0) word.put(key, cursor.isNull(index) ? JSONObject.NULL : cursor.getString(index));
        }
        for (String key : new String[]{"legacy_id", "seed_order"}) {
            int index = cursor.getColumnIndex(key);
            if (index >= 0) word.put(key, cursor.isNull(index) ? JSONObject.NULL : cursor.getLong(index));
        }
        return word;
    }

    private String bookName(SQLiteDatabase database, String bookKey) {
        return scalarString(database, "SELECT name FROM wordbooks WHERE book_key = ?", bookKey);
    }

    private int bookLegacyId(SQLiteDatabase database, String bookKey) {
        return scalar(database, "SELECT legacy_id FROM wordbooks WHERE book_key = ?", bookKey);
    }

    private JSONObject insertUserWord(SQLiteDatabase database, String bookKey, String word, String phonetic,
                                      String pos, String meaning, String example) {
        String normalizedWord = word.trim();
        if (normalizedWord.isEmpty() || meaning == null || meaning.trim().isEmpty()) {
            throw new StoreException("单词和释义必填。", "INVALID_ARGUMENT");
        }
        String wordKey = "user:" + UUID.randomUUID();
        long legacyId = nextLegacyId(database, "words", "legacy_id", "legacy_word_id_counter");
        ContentValues values = new ContentValues();
        values.put("word_key", wordKey);
        values.put("legacy_id", legacyId);
        values.put("book_key", bookKey);
        values.put("word", normalizedWord);
        values.put("phonetic", phonetic == null ? "" : phonetic.trim());
        values.put("pos", pos == null ? "" : pos.trim());
        values.put("meaning", meaning.trim());
        values.put("example", example == null ? "" : example.trim());
        values.put("seed_order", scalar(database, "SELECT COALESCE(MAX(seed_order), 0) + 1 FROM words WHERE book_key = ?", bookKey));
        try {
            database.insertOrThrow("words", null, values);
        } catch (android.database.sqlite.SQLiteConstraintException error) {
            throw new StoreException("该单词已存在于此词库。", "DUPLICATE_WORD", error);
        }
        JSONObject result = new JSONObject();
        try {
            result.put("word_key", wordKey);
            result.put("legacy_id", legacyId);
        } catch (JSONException impossible) {
            throw new IllegalStateException(impossible);
        }
        return result;
    }

    private long nextLegacyId(SQLiteDatabase database, String table, String column, String counterKey) {
        long maximum = scalar(database, "SELECT COALESCE(MAX(" + column + "), 0) FROM " + table);
        String prior = scalarString(database, "SELECT value FROM app_meta WHERE key = ?", counterKey);
        if (prior != null) {
            try { maximum = Math.max(maximum, Long.parseLong(prior)); } catch (NumberFormatException ignored) {}
        }
        long next = maximum + 1;
        ContentValues value = new ContentValues();
        value.put("key", counterKey);
        value.put("value", String.valueOf(next));
        database.insertWithOnConflict("app_meta", null, value, SQLiteDatabase.CONFLICT_REPLACE);
        return next;
    }

    private static String nullableString(Cursor cursor, String column) {
        int index = cursor.getColumnIndexOrThrow(column);
        return cursor.isNull(index) ? null : cursor.getString(index);
    }

    private static String nullableString(JSONObject object, String field) {
        return object == null || object.isNull(field) ? null : object.optString(field, null);
    }

    private static int scalar(SQLiteDatabase database, String sql, String... args) {
        try (Cursor cursor = database.rawQuery(sql, args)) {
            return cursor.moveToFirst() ? cursor.getInt(0) : 0;
        }
    }

    private static String scalarString(SQLiteDatabase database, String sql, String... args) {
        try (Cursor cursor = database.rawQuery(sql, args)) {
            return cursor.moveToFirst() ? cursor.getString(0) : null;
        }
    }

    private SQLiteDatabase writable() {
        try {
            SQLiteDatabase database = helper.getWritableDatabase();
            helper.synchronizeSeedBundle(database);
            return database;
        } catch (RuntimeException error) {
            throw new StoreException("本地数据库不可用。", "STORAGE_UNAVAILABLE", error);
        }
    }

    private String localDateTime() {
        return format("yyyy-MM-dd HH:mm:ss", timeSource.nowMillis());
    }

    private String localDay() {
        return format("yyyy-MM-dd", timeSource.nowMillis());
    }

    private String dateAfter(int amount, int calendarField) {
        Calendar calendar = Calendar.getInstance(timeSource.timeZone(), Locale.ROOT);
        calendar.setTimeInMillis(timeSource.nowMillis());
        calendar.add(calendarField, amount);
        return format("yyyy-MM-dd HH:mm:ss", calendar.getTimeInMillis());
    }

    private String dateOffset(int days) {
        return offsetDay(localDay(), days);
    }

    private String offsetDay(String day, int offset) {
        Calendar calendar = parseDay(day);
        calendar.add(Calendar.DAY_OF_MONTH, offset);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
        formatter.setTimeZone(timeSource.timeZone());
        return formatter.format(calendar.getTime());
    }

    private String format(String pattern, long time) {
        SimpleDateFormat formatter = new SimpleDateFormat(pattern, Locale.ROOT);
        formatter.setTimeZone(timeSource.timeZone());
        return formatter.format(new Date(time));
    }

    private long dayOrdinal(String day) {
        Calendar local = parseDay(day);
        Calendar utc = Calendar.getInstance(TimeZone.getTimeZone("UTC"), Locale.ROOT);
        utc.clear();
        utc.set(local.get(Calendar.YEAR), local.get(Calendar.MONTH), local.get(Calendar.DAY_OF_MONTH));
        return Math.floorDiv(utc.getTimeInMillis(), 86_400_000L);
    }

    private Calendar parseDay(String day) {
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd", Locale.ROOT);
        formatter.setLenient(false);
        formatter.setTimeZone(timeSource.timeZone());
        try {
            Date date = formatter.parse(day);
            if (date == null || !day.equals(formatter.format(date))) throw new ParseException("invalid day", 0);
            Calendar calendar = Calendar.getInstance(timeSource.timeZone(), Locale.ROOT);
            calendar.setTime(date);
            return calendar;
        } catch (ParseException error) {
            throw new StoreException("目标日期格式应为 YYYY-MM-DD。", "INVALID_ARGUMENT", error);
        }
    }

    private boolean isValidDay(String day) {
        if (day == null || !day.matches("\\d{4}-\\d{2}-\\d{2}")) return false;
        try { parseDay(day); return true; } catch (StoreException error) { return false; }
    }

    private int compareDays(String first, String second) {
        return Long.compare(dayOrdinal(first), dayOrdinal(second));
    }

    private static double clampRandom(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return 0;
        return Math.max(0, Math.min(1 - Math.ulp(1.0), value));
    }

    @Override public void close() { helper.close(); }

    static final class StoreException extends RuntimeException {
        final String code;
        StoreException(String message, String code) { super(message); this.code = code; }
        StoreException(String message, String code, Throwable cause) { super(message, cause); this.code = code; }
    }

    private static final class ExistingRequest {
        final String wordKey;
        final boolean correct;
        final String outcome;
        final String requestPayload;
        ExistingRequest(String wordKey, boolean correct, String outcome, String requestPayload) {
            this.wordKey = wordKey;
            this.correct = correct;
            this.outcome = outcome;
            this.requestPayload = requestPayload;
        }
    }
}
