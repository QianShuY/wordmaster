package io.wordmaster.g0prototype;

import java.util.Locale;

final class WordmasterStudyRules {
    private WordmasterStudyRules() {}

    static String normalizeSpelling(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    static String normalizeSpellingAnswer(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z\\s'-]", "")
            .replaceAll("\\s+", " ")
            .trim();
    }

    static String normalizePartOfSpeech(String value) {
        String pos = value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("\\s", "");
        if (pos.matches("^v[ti]?\\..*")) return "v.";
        if (pos.startsWith("a.") || pos.startsWith("adj.")) return "adj.";
        if (pos.startsWith("ad.") || pos.startsWith("adv.")) return "adv.";
        if (pos.startsWith("n.")) return "n.";
        if (pos.startsWith("prep")) return "prep.";
        if (pos.startsWith("conj")) return "conj.";
        if (pos.startsWith("pron")) return "pron.";
        if (pos.startsWith("art")) return "art.";
        return null;
    }

    static Boolean judge(String mode, String submitted, String word, String meaning, String pos) {
        if ("spelling".equals(mode)) return normalizeSpellingAnswer(submitted).equals(normalizeSpelling(word));
        if ("meaning".equals(mode)) return meaning != null && meaning.equals(submitted == null ? "" : submitted);
        if ("pos".equals(mode)) {
            String expected = normalizePartOfSpeech(pos);
            String actual = normalizePartOfSpeech(submitted);
            return expected != null && actual != null && expected.equals(actual);
        }
        return null;
    }

    static int nextStreak(int current, boolean correct) {
        return correct ? Math.max(0, current) + 1 : 0;
    }

    static int nextScheduleDays(int streak) {
        int[] days = { 1, 2, 4, 7, 15, 30 };
        int index = Math.max(0, Math.min(days.length - 1, streak - 1));
        return days[index];
    }

    static int dailyQuota(int remainingNew, int dailyNew, boolean planActive, int daysLeft) {
        int remaining = Math.max(0, remainingNew);
        if (!planActive) return Math.min(50, Math.max(0, dailyNew));
        int days = Math.max(1, daysLeft);
        return Math.min(200, (int) Math.ceil(remaining / (double) days));
    }

    static int[] studyQueueLimits(String mode, int dailyQuota, int newToday, boolean wantAll, int requestedLimit) {
        int availableNew = Math.max(0, dailyQuota - Math.max(0, newToday));
        if ("learn".equals(mode)) {
            int limit = !wantAll && requestedLimit > 0 ? Math.min(requestedLimit, 50) : 50;
            return new int[]{0, wantAll ? 50 : Math.min(availableNew, limit)};
        }
        return new int[]{wantAll ? 100 : 200, wantAll ? 0 : Math.min(availableNew, 100)};
    }

    static boolean qualifiesForCard(int answered, int target) {
        return answered >= target;
    }

    static String classifyOutcome(boolean correct, boolean isRetry, String requested) {
        if (correct) return isRetry ? "retry_correct" : "first_correct";
        if (!"wrong".equals(requested) && !"abandoned".equals(requested)) {
            throw new IllegalArgumentException("incorrect attempts must be wrong or abandoned");
        }
        return requested;
    }

    static int cardWeight(String rarity) {
        if ("N".equals(rarity)) return 50;
        if ("R".equals(rarity)) return 30;
        if ("SR".equals(rarity)) return 15;
        if ("UR".equals(rarity)) return 5;
        return 10;
    }

    static int weightedCardIndex(int[] weights, double random) {
        if (weights == null || weights.length == 0) return -1;
        int total = 0;
        for (int weight : weights) total += Math.max(0, weight);
        if (total <= 0) return -1;
        double bounded = Double.isNaN(random) || Double.isInfinite(random) ? 0 : Math.max(0, Math.min(1 - Math.ulp(1.0), random));
        double target = bounded * total;
        int cumulative = 0;
        for (int i = 0; i < weights.length; i++) {
            cumulative += Math.max(0, weights[i]);
            if (target < cumulative) return i;
        }
        return weights.length - 1;
    }
}
