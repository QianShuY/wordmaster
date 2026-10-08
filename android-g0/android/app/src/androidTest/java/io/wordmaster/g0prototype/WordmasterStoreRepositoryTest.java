package io.wordmaster.g0prototype;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.getcapacitor.JSObject;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class WordmasterStoreRepositoryTest {
    private Context context;

    @Before
    public void setUp() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        context.deleteDatabase(WordmasterStoreRepository.DATABASE_NAME);
    }

    @Test
    public void identicalRequestRetryDoesNotIncrementProgressTwice() throws Exception {
        try (WordmasterStoreRepository repository = new WordmasterStoreRepository(context)) {
            JSObject first = repository.submitAnswer(WordmasterStoreRepository.WORD_KEY, requestId(1), "abandon");
            JSObject retry = repository.submitAnswer(WordmasterStoreRepository.WORD_KEY, requestId(1), " ABANDON ");

            assertFalse(first.getBoolean("duplicate"));
            assertTrue(retry.getBoolean("duplicate"));
            assertTrue(retry.getBoolean("correct"));
            assertEquals(1, retry.getJSONObject("state").getInt("attempts"));
            assertEquals(1, countReviewRows());
        }
    }

    @Test
    public void reusingRequestIdWithDifferentAnswerConflictsWithoutWritingAgain() throws Exception {
        try (WordmasterStoreRepository repository = new WordmasterStoreRepository(context)) {
            repository.submitAnswer(WordmasterStoreRepository.WORD_KEY, requestId(2), "abandon");
            try {
                repository.submitAnswer(WordmasterStoreRepository.WORD_KEY, requestId(2), "abandoned");
                fail("Expected REQUEST_CONFLICT");
            } catch (WordmasterStoreRepository.StoreException error) {
                assertEquals("REQUEST_CONFLICT", error.code);
            }

            assertEquals(1, repository.getState().getInteger("attempts").intValue());
            assertEquals(1, countReviewRows());
        }
    }

    @Test
    public void failureAfterReviewInsertRollsBackBothTables() throws Exception {
        String requestId = requestId(3);
        try (WordmasterStoreRepository repository = new WordmasterStoreRepository(context, () -> {
            throw new IllegalStateException("injected after review insert");
        })) {
            try {
                repository.submitAnswer(WordmasterStoreRepository.WORD_KEY, requestId, "abandon");
                fail("Expected injected storage failure");
            } catch (WordmasterStoreRepository.StoreException error) {
                assertEquals("STORAGE_WRITE_FAILED", error.code);
                assertNotNull(error.getCause());
            }
        }

        try (WordmasterStoreRepository repository = new WordmasterStoreRepository(context)) {
            JSObject retry = repository.submitAnswer(WordmasterStoreRepository.WORD_KEY, requestId, "abandon");
            assertFalse(retry.getBoolean("duplicate"));
            assertEquals(1, retry.getJSONObject("state").getInt("attempts"));
            assertEquals(1, repository.getState().getInteger("attempts").intValue());
            assertEquals(1, countReviewRows());
        }
    }

    private static String requestId(int suffix) {
        return String.format("00000000-0000-4000-8000-%012d", suffix);
    }

    private int countReviewRows() {
        SQLiteDatabase database = SQLiteDatabase.openDatabase(
            context.getDatabasePath(WordmasterStoreRepository.DATABASE_NAME).getPath(),
            null,
            SQLiteDatabase.OPEN_READONLY
        );
        try (Cursor cursor = database.rawQuery("SELECT COUNT(*) FROM review_log", null)) {
            assertTrue(cursor.moveToFirst());
            return cursor.getInt(0);
        } finally {
            database.close();
        }
    }
}
