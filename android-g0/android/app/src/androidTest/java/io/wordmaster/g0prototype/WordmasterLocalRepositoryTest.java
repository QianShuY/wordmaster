package io.wordmaster.g0prototype;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.getcapacitor.JSObject;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

@RunWith(AndroidJUnit4.class)
public class WordmasterLocalRepositoryTest {
    private Context context;

    @Before
    public void setUp() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        context.deleteDatabase(WordmasterLocalRepository.DATABASE_NAME);
        context.deleteDatabase(WordmasterStoreRepository.DATABASE_NAME);
    }

    @Test
    public void installsAllBuiltInRowsAndStartsWithEmptyPersonalTables() throws Exception {
        try (WordmasterLocalRepository repository = repository(new MutableTime("2026-09-20 10:00:00"))) {
            JSONArray books = repository.listBooks();
            assertEquals(5, books.length());
            assertEquals(20374, repository.getGlobalStats().getInteger("total_words").intValue());
            assertEquals(62, repository.getCardCatalog().getJSONArray("cards").length());
            assertEquals(0, repository.getGlobalStats().getInteger("today_reviewed").intValue());
            assertEquals(0, tableCount("progress"));
            assertEquals(0, tableCount("review_log"));
            assertEquals(0, tableCount("user_cards"));
            assertEquals(0, tableCount("card_draws"));

            JSONArray learn = repository.getStudyQueue(WordmasterLocalRepository.DEFAULT_BOOK_KEY, "learn", false, 3);
            assertEquals(3, learn.length());
            JSONArray meaning = repository.getStudyQueue(WordmasterLocalRepository.DEFAULT_BOOK_KEY, "meaning", false, 50);
            assertEquals(15, meaning.length());
            for (int i = 0; i < meaning.length(); i++) {
                assertEquals(4, meaning.getJSONObject(i).getJSONArray("choices").length());
            }
        }
    }

    @Test
    public void sharedFixtureMatchesAndroidRulesAtQueueQuotaAndWeightBoundaries() throws Exception {
        JSONObject fixture = readSharedFixture();
        JSONArray judgements = fixture.getJSONArray("judgements");
        for (int i = 0; i < judgements.length(); i++) {
            JSONObject sample = judgements.getJSONObject(i);
            Boolean actual = WordmasterStudyRules.judge(sample.getString("mode"), sample.optString("submitted"),
                sample.getString("word"), sample.getString("meaning"), sample.getString("pos"));
            if (sample.isNull("expected")) assertTrue(actual == null);
            else assertEquals(sample.getBoolean("expected"), actual.booleanValue());
        }

        JSONArray outcomes = fixture.getJSONArray("outcomes");
        for (int i = 0; i < outcomes.length(); i++) {
            JSONObject sample = outcomes.getJSONObject(i);
            assertEquals(sample.getString("expected"), WordmasterStudyRules.classifyOutcome(
                sample.getBoolean("correct"), sample.getBoolean("retry"), sample.getString("requested")));
        }

        JSONArray intervals = fixture.getJSONArray("review_intervals");
        for (int i = 0; i < intervals.length(); i++) assertEquals(intervals.getInt(i), WordmasterStudyRules.nextScheduleDays(i + 1));
        JSONObject plan = fixture.getJSONObject("plans");
        assertEquals(plan.getInt("active_quota"), WordmasterStudyRules.dailyQuota(
            plan.getInt("remaining_new"), plan.getInt("daily_new"), true, plan.getInt("days_left")));
        assertEquals(plan.getInt("inactive_quota"), WordmasterStudyRules.dailyQuota(
            plan.getInt("remaining_new"), plan.getInt("inactive_daily_new"), false, 1));

        JSONObject queues = fixture.getJSONObject("queues");
        int[] limits = WordmasterStudyRules.studyQueueLimits("spelling", queues.getInt("daily_quota"), queues.getInt("new_today"), false, 0);
        assertEquals(queues.getInt("expected_due_limit"), limits[0]);
        assertEquals(queues.getInt("expected_new_limit"), limits[1]);
        List<String> actualQueue = new ArrayList<>();
        JSONArray due = queues.getJSONArray("due");
        JSONArray fresh = queues.getJSONArray("fresh");
        for (int i = 0; i < Math.min(limits[0], due.length()); i++) actualQueue.add(due.getString(i));
        for (int i = 0; i < Math.min(limits[1], fresh.length()); i++) actualQueue.add(fresh.getString(i));
        List<String> expectedQueue = new ArrayList<>();
        JSONArray expected = queues.getJSONArray("expected_review_order");
        for (int i = 0; i < expected.length(); i++) expectedQueue.add(expected.getString(i));
        assertEquals(expectedQueue, actualQueue);
        int[] allLimits = WordmasterStudyRules.studyQueueLimits("meaning", 3, 1, true, 0);
        assertEquals(queues.getInt("all_due_limit"), allLimits[0]);
        assertEquals(queues.getInt("all_new_limit"), allLimits[1]);
        assertEquals(queues.getInt("expected_learn_limit"),
            WordmasterStudyRules.studyQueueLimits("learn", 3, 1, false, queues.getInt("learn_requested_limit"))[1]);

        JSONObject draw = fixture.getJSONObject("card_draw");
        assertFalse(WordmasterStudyRules.qualifiesForCard(draw.getInt("below"), draw.getInt("target")));
        assertTrue(WordmasterStudyRules.qualifiesForCard(draw.getInt("at"), draw.getInt("target")));
        JSONArray randomValues = draw.getJSONArray("random_values");
        JSONArray expectedIndexes = draw.getJSONArray("expected_indexes");
        int[] weights = new int[draw.getJSONArray("weights").length()];
        for (int i = 0; i < weights.length; i++) weights[i] = draw.getJSONArray("weights").getInt(i);
        for (int i = 0; i < randomValues.length(); i++) {
            assertEquals(expectedIndexes.getInt(i), WordmasterStudyRules.weightedCardIndex(weights, randomValues.getDouble(i)));
        }
    }

    @Test
    public void customBooksAndWordsSupportCreateEditDuplicateImportAndDelete() throws Exception {
        try (WordmasterLocalRepository repository = repository(new MutableTime("2026-09-20 10:00:00"))) {
            JSObject createdBook = repository.createBook("我的词库", "G2 本地管理");
            String bookKey = createdBook.getString("book_key");
            int bookId = createdBook.getInteger("id");
            assertEquals(6, bookId);

            JSObject createdWord = repository.addWord(bookKey, "resilient", "rɪˈzɪliənt", "adj.", "有韧性的", "");
            int wordId = createdWord.getInteger("id");
            assertEquals(20375, wordId);
            assertEquals(1, repository.listWords(bookKey).length());

            repository.updateWord(createdWord.getString("word_key"), "resilience", "rɪˈzɪliəns", "n.", "韧性", "");
            assertEquals("resilience", repository.listWords(bookKey).getJSONObject(0).getString("word"));
            try {
                repository.addWord(bookKey, "resilience", "", "n.", "韧性", "");
                fail("Expected duplicate word rejection");
            } catch (WordmasterLocalRepository.StoreException error) {
                assertEquals("DUPLICATE_WORD", error.code);
            }

            JSONArray imports = new JSONArray();
            imports.put(new JSONObject().put("word", "resilience").put("meaning", "韧性"));
            imports.put(new JSONObject().put("word", "adaptable").put("meaning", "能适应的"));
            JSObject importResult = repository.importWords(bookKey, imports);
            assertEquals(1, importResult.getInteger("added").intValue());
            assertEquals(1, importResult.getInteger("dup").intValue());
            assertEquals(2, repository.listWords(bookKey).length());

            repository.deleteWord(createdWord.getString("word_key"));
            assertEquals(1, repository.listWords(bookKey).length());
            repository.deleteBook(bookKey);
            assertEquals(5, repository.listBooks().length());
        }
    }

    @Test
    public void wrongAnswersReenterDueQueueAndRetryKeepsOutcomeAndStatsConsistent() throws Exception {
        MutableTime time = new MutableTime("2026-09-20 10:00:00");
        try (WordmasterLocalRepository repository = repository(time)) {
            JSObject state = repository.getState();
            String wordKey = state.getString("wordKey");
            String session = "session-g1-retry-0001";

            JSObject wrong = repository.submitAnswer(wordKey, "request-g1-wrong-0001", "not-the-answer", "spelling", session, true, "wrong");
            assertFalse(wrong.getBoolean("correct"));
            assertEquals("wrong", wrong.getString("outcome"));
            assertEquals(1, repository.listMistakes(false, "spelling").length());

            time.advanceMinutes(11);
            JSONArray due = repository.getStudyQueue(WordmasterLocalRepository.DEFAULT_BOOK_KEY, "spelling", false, 50);
            assertEquals(wordKey, due.getJSONObject(0).getString("word_key"));

            repository.clearMistake(wordKey);
            assertEquals(0, repository.listMistakes(false, "spelling").length());
            JSObject retry = repository.submitAnswer(wordKey, "request-g1-retry-0002", state.getString("word"), "spelling", session, false, "first_correct");
            assertTrue(retry.getBoolean("correct"));
            assertEquals("retry_correct", retry.getString("outcome"));

            JSObject meaning = repository.submitAnswer(wordKey, "request-g1-meaning-0003", state.getString("prompt"), "meaning", "session-g1-meaning-0001", false, "first_correct");
            assertTrue(meaning.getBoolean("correct"));
            assertEquals("first_correct", meaning.getString("outcome"));
            JSObject partOfSpeech = repository.submitAnswer(wordKey, "request-g1-pos-0004", "n.", "pos", "session-g1-pos-0001", false, "first_correct");
            assertTrue(partOfSpeech.getBoolean("correct"));

            JSObject stats = repository.getGlobalStats();
            assertEquals(4, stats.getInteger("today_reviewed").intValue());
            assertEquals(3, stats.getInteger("total_correct").intValue());
            assertEquals(1, stats.getInteger("total_wrong").intValue());
            assertEquals(1, stats.getInteger("mastered").intValue());
        }
    }

    @Test
    public void repeatedRequestIsIdempotentAndDifferentPayloadConflicts() throws Exception {
        try (WordmasterLocalRepository repository = repository(new MutableTime("2026-09-20 10:00:00"))) {
            JSObject state = repository.getState();
            String wordKey = state.getString("wordKey");
            JSObject first = repository.submitAnswer(wordKey, "request-g1-dup-0001", "not-the-answer", "spelling", "session-g1-dup-0001", true, "wrong");
            JSObject retry = repository.submitAnswer(wordKey, "request-g1-dup-0001", " NOT-THE-ANSWER ", "spelling", "session-g1-dup-0001", true, "wrong");
            assertFalse(first.getBoolean("duplicate"));
            assertTrue(retry.getBoolean("duplicate"));
            assertEquals(1, tableCount("review_log"));

            try {
                repository.submitAnswer(wordKey, "request-g1-dup-0001", "a-different-answer", "spelling", "session-g1-dup-0001", true, "wrong");
                fail("Expected REQUEST_CONFLICT");
            } catch (WordmasterLocalRepository.StoreException error) {
                assertEquals("REQUEST_CONFLICT", error.code);
            }
            assertEquals(1, tableCount("review_log"));
        }
    }

    @Test
    public void failedReviewTransactionCanRetryAndDoesNotLeaveHalfProgress() throws Exception {
        MutableTime time = new MutableTime("2026-09-20 10:00:00");
        JSObject state;
        try (WordmasterLocalRepository repository = repository(time)) {
            state = repository.getState();
        }
        try (WordmasterLocalRepository repository = new WordmasterLocalRepository(context, time, () -> 0,
            () -> { throw new IllegalStateException("injected failure after log insert"); }, () -> {})) {
            try {
                repository.submitAnswer(state.getString("wordKey"), "request-g1-fail-0001", state.getString("word"),
                    "spelling", "session-g1-fail-0001", true, "first_correct");
                fail("Expected injected storage failure");
            } catch (WordmasterLocalRepository.StoreException error) {
                assertEquals("STORAGE_WRITE_FAILED", error.code);
            }
            assertEquals(0, tableCount("review_log"));
            assertEquals(0, tableCount("progress"));
        }
        try (WordmasterLocalRepository repository = repository(time)) {
            JSObject retry = repository.submitAnswer(state.getString("wordKey"), "request-g1-fail-0001", state.getString("word"),
                "spelling", "session-g1-fail-0001", true, "first_correct");
            assertFalse(retry.getBoolean("duplicate"));
            assertEquals(1, tableCount("review_log"));
            assertEquals(1, tableCount("progress"));
        }
    }

    @Test
    public void dailyCardThresholdWeightAndHiddenUnlockAreAtomic() throws Exception {
        MutableTime time = new MutableTime("2026-09-20 10:00:00");
        try (WordmasterLocalRepository repository = new WordmasterLocalRepository(context, time, () -> 0,
            () -> {}, () -> {})) {
            JSObject state = repository.getState();
            SQLiteDatabase db = writableDatabase();
            String yesterday = "2026-09-19 10:00:00";
            for (int id = 1; id <= 9; id++) {
                ContentValues values = new ContentValues();
                values.put("card_id", id);
                values.put("earned_at", yesterday);
                db.insertOrThrow("user_cards", null, values);
            }
            db.close();
            for (int i = 0; i < 10; i++) {
                repository.submitAnswer(state.getString("wordKey"), String.format(Locale.ROOT, "request-g1-card-%04d", i),
                    "wrong-answer", "spelling", "session-g1-card-0001", true, "wrong");
            }
            assertEquals(10, repository.getCardCatalog().getInteger("today_answered").intValue());
            JSObject drawn = repository.drawCard();
            assertFalse(drawn.getBoolean("duplicate"));
            JSONObject drawnCard = drawn.getJSONObject("card");
            assertEquals("savepoint", drawnCard.getString("palette"));
            assertEquals(30, WordmasterStudyRules.cardWeight(drawnCard.getString("rarity")));
            assertEquals(1, tableCount("card_draws"));
            assertEquals(10, tableCount("user_cards"));
            JSONArray unlocked = drawn.getJSONArray("unlocked");
            assertEquals(1, unlocked.length());
            assertEquals("hawking", unlocked.getJSONObject(0).getString("palette"));
            assertEquals(1, repository.getAvailableCardCopy().names().length());

            try {
                repository.drawCard();
                fail("Expected ALREADY_DRAWN");
            } catch (WordmasterLocalRepository.StoreException error) {
                assertEquals("ALREADY_DRAWN", error.code);
            }
            assertEquals(1, tableCount("card_draws"));
            assertEquals(11, tableCount("user_cards"));
        }
    }

    @Test
    public void v1UpgradeKeepsProgressAndReviewRows() throws Exception {
        File target = context.getDatabasePath(WordmasterLocalRepository.DATABASE_NAME);
        File parent = target.getParentFile();
        if (parent != null && !parent.exists()) assertTrue(parent.mkdirs());
        try (InputStream input = context.getAssets().open("wordmaster-seed.db");
             FileOutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[16 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        }
        SQLiteDatabase old = SQLiteDatabase.openDatabase(target.getAbsolutePath(), null, SQLiteDatabase.OPEN_READWRITE);
        ContentValues progress = new ContentValues();
        progress.put("word_key", WordmasterLocalRepository.DEFAULT_WORD_KEY);
        progress.put("correct", 4);
        progress.put("wrong", 2);
        progress.put("streak", 1);
        progress.put("last_review", "2026-09-20 10:00:00");
        progress.put("next_due", "2026-09-21 10:00:00");
        progress.put("first_studied", "2026-09-20 10:00:00");
        old.insertOrThrow("progress", null, progress);
        ContentValues review = new ContentValues();
        review.put("word_key", WordmasterLocalRepository.DEFAULT_WORD_KEY);
        review.put("correct", 1);
        review.put("is_new", 1);
        review.put("ts", "2026-09-20 10:00:00");
        review.put("request_id", "legacy-event-g1-0001");
        review.put("outcome", "first_correct");
        review.put("session_id", "legacy-session-g1-0001");
        review.put("request_payload", "{}");
        old.insertOrThrow("review_log", null, review);
        old.close();

        try (WordmasterLocalRepository repository = repository(new MutableTime("2026-09-20 11:00:00"))) {
            repository.getState();
        }
        SQLiteDatabase upgraded = SQLiteDatabase.openDatabase(target.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
        try {
            assertEquals(3, scalar(upgraded, "PRAGMA user_version"));
            try (Cursor cursor = upgraded.rawQuery("SELECT correct, wrong, streak FROM progress WHERE word_key = ?",
                new String[]{WordmasterLocalRepository.DEFAULT_WORD_KEY})) {
                assertTrue(cursor.moveToFirst());
                assertEquals(4, cursor.getInt(0));
                assertEquals(2, cursor.getInt(1));
                assertEquals(1, cursor.getInt(2));
            }
            try (Cursor cursor = upgraded.rawQuery("SELECT local_day, timezone_id FROM review_log", null)) {
                assertTrue(cursor.moveToFirst());
                assertEquals("2026-09-20", cursor.getString(0));
                assertEquals("legacy-unknown", cursor.getString(1));
            }
            try (Cursor cursor = upgraded.rawQuery("PRAGMA integrity_check", null)) {
                assertTrue(cursor.moveToFirst());
                assertEquals("ok", cursor.getString(0));
            }
        } finally {
            upgraded.close();
        }
    }

    private WordmasterLocalRepository repository(MutableTime time) {
        return new WordmasterLocalRepository(context, time, () -> 0, () -> {}, () -> {});
    }

    private SQLiteDatabase writableDatabase() {
        WordmasterDatabaseHelper helper = new WordmasterDatabaseHelper(context);
        return helper.getWritableDatabase();
    }

    private int tableCount(String table) {
        SQLiteDatabase database = SQLiteDatabase.openDatabase(context.getDatabasePath(WordmasterLocalRepository.DATABASE_NAME).getAbsolutePath(),
            null, SQLiteDatabase.OPEN_READONLY);
        try (Cursor cursor = database.rawQuery("SELECT COUNT(*) FROM " + table, null)) {
            assertTrue(cursor.moveToFirst());
            return cursor.getInt(0);
        } finally {
            database.close();
        }
    }

    private int scalar(SQLiteDatabase database, String sql) {
        try (Cursor cursor = database.rawQuery(sql, null)) {
            assertTrue(cursor.moveToFirst());
            return cursor.getInt(0);
        }
    }

    private JSONObject readSharedFixture() throws Exception {
        try (InputStream input = InstrumentationRegistry.getInstrumentation().getContext().getAssets().open("android-g1-rules.json");
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return new JSONObject(new String(output.toByteArray(), java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    private static final class MutableTime implements WordmasterLocalRepository.TimeSource {
        private long value;
        private final TimeZone zone = TimeZone.getTimeZone("UTC");

        MutableTime(String initial) throws Exception {
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.ROOT);
            format.setTimeZone(zone);
            value = format.parse(initial).getTime();
        }

        void advanceMinutes(int minutes) { value += minutes * 60_000L; }
        @Override public long nowMillis() { return value; }
        @Override public TimeZone timeZone() { return zone; }
    }
}
