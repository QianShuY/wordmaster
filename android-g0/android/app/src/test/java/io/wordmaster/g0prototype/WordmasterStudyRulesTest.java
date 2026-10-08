package io.wordmaster.g0prototype;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WordmasterStudyRulesTest {
    @Test
    public void spellingMeaningAndPartOfSpeechMatchSharedG1Fixture() {
        assertEquals(Boolean.TRUE, WordmasterStudyRules.judge("spelling", " MOTHER-IN-LAW ", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(Boolean.TRUE, WordmasterStudyRules.judge("spelling", "mother-in-law!", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(Boolean.FALSE, WordmasterStudyRules.judge("spelling", "mother in law", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(Boolean.TRUE, WordmasterStudyRules.judge("meaning", "岳母；婆婆", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(Boolean.FALSE, WordmasterStudyRules.judge("meaning", "岳母", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(Boolean.TRUE, WordmasterStudyRules.judge("pos", "v.", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(Boolean.FALSE, WordmasterStudyRules.judge("pos", "adj.", "mother-in-law", "岳母；婆婆", "vt./vi."));
        assertEquals(null, WordmasterStudyRules.judge("learn", "", "mother-in-law", "岳母；婆婆", "vt./vi."));
    }

    @Test
    public void reviewOutcomesAndQueueCapsMatchWebRules() {
        assertEquals("first_correct", WordmasterStudyRules.classifyOutcome(true, false, "first_correct"));
        assertEquals("retry_correct", WordmasterStudyRules.classifyOutcome(true, true, "first_correct"));
        assertEquals("wrong", WordmasterStudyRules.classifyOutcome(false, false, "wrong"));
        assertEquals("abandoned", WordmasterStudyRules.classifyOutcome(false, false, "abandoned"));
        assertEquals(3, WordmasterStudyRules.dailyQuota(21, 15, true, 7));
        assertEquals(50, WordmasterStudyRules.dailyQuota(21, 80, false, 1));
        assertEquals(200, WordmasterStudyRules.dailyQuota(1000, 15, true, 1));
        assertEquals(1, WordmasterStudyRules.nextScheduleDays(1));
        assertEquals(2, WordmasterStudyRules.nextScheduleDays(2));
        assertEquals(4, WordmasterStudyRules.nextScheduleDays(3));
        assertEquals(7, WordmasterStudyRules.nextScheduleDays(4));
        assertEquals(15, WordmasterStudyRules.nextScheduleDays(5));
        assertEquals(30, WordmasterStudyRules.nextScheduleDays(6));
        assertEquals(30, WordmasterStudyRules.nextScheduleDays(7));

        int[] review = WordmasterStudyRules.studyQueueLimits("spelling", 3, 1, false, 0);
        assertEquals(200, review[0]);
        assertEquals(2, review[1]);
        int[] all = WordmasterStudyRules.studyQueueLimits("meaning", 3, 1, true, 0);
        assertEquals(100, all[0]);
        assertEquals(0, all[1]);
        int[] learn = WordmasterStudyRules.studyQueueLimits("learn", 3, 1, false, 1);
        assertEquals(0, learn[0]);
        assertEquals(1, learn[1]);
    }

    @Test
    public void cardEligibilityAndWeightedBoundariesMatchWebRules() {
        assertFalse(WordmasterStudyRules.qualifiesForCard(9, 10));
        assertTrue(WordmasterStudyRules.qualifiesForCard(10, 10));
        assertEquals(50, WordmasterStudyRules.cardWeight("N"));
        assertEquals(30, WordmasterStudyRules.cardWeight("R"));
        assertEquals(15, WordmasterStudyRules.cardWeight("SR"));
        assertEquals(5, WordmasterStudyRules.cardWeight("UR"));
        int[] weights = {50, 30, 15, 5};
        assertEquals(0, WordmasterStudyRules.weightedCardIndex(weights, 0));
        assertEquals(1, WordmasterStudyRules.weightedCardIndex(weights, .5));
        assertEquals(2, WordmasterStudyRules.weightedCardIndex(weights, .8));
        assertEquals(3, WordmasterStudyRules.weightedCardIndex(weights, .95));
    }
}
