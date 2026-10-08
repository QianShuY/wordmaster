package io.wordmaster.g0prototype;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "WordmasterStore")
public class WordmasterStorePlugin extends Plugin {
    private volatile WordmasterLocalRepository repository;
    private final ExecutorService storageWorker = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        // Opening/copying the 20k-word seed stays off the WebView/UI thread.
    }

    @PluginMethod
    public void getState(PluginCall call) {
        run(call, () -> call.resolve(store().getState()));
    }

    @PluginMethod
    public void listBooks(PluginCall call) {
        run(call, () -> {
            JSObject response = new JSObject();
            response.put("books", store().listBooks());
            call.resolve(response);
        });
    }

    @PluginMethod
    public void listWords(PluginCall call) {
        run(call, () -> {
            JSObject response = new JSObject();
            response.put("words", store().listWords(call.getString("bookKey")));
            call.resolve(response);
        });
    }

    @PluginMethod
    public void createBook(PluginCall call) {
        run(call, () -> call.resolve(store().createBook(call.getString("name"), call.getString("description"))));
    }

    @PluginMethod
    public void deleteBook(PluginCall call) {
        run(call, () -> call.resolve(store().deleteBook(call.getString("bookKey"))));
    }

    @PluginMethod
    public void addWord(PluginCall call) {
        run(call, () -> {
            JSObject data = call.getData();
            call.resolve(store().addWord(data.optString("bookKey"), data.optString("word"), data.optString("phonetic"),
                data.optString("pos"), data.optString("meaning"), data.optString("example")));
        });
    }

    @PluginMethod
    public void updateWord(PluginCall call) {
        run(call, () -> {
            JSObject data = call.getData();
            call.resolve(store().updateWord(data.optString("wordKey"), data.optString("word"), data.optString("phonetic"),
                data.optString("pos"), data.optString("meaning"), data.optString("example")));
        });
    }

    @PluginMethod
    public void deleteWord(PluginCall call) {
        run(call, () -> call.resolve(store().deleteWord(call.getString("wordKey"))));
    }

    @PluginMethod
    public void importWords(PluginCall call) {
        run(call, () -> call.resolve(store().importWords(call.getString("bookKey"), call.getData().optJSONArray("words"))));
    }

    @PluginMethod
    public void getStudyQueue(PluginCall call) {
        run(call, () -> {
            JSObject data = call.getData();
            JSObject response = new JSObject();
            response.put("words", store().getStudyQueue(
                data.optString("bookKey", WordmasterLocalRepository.DEFAULT_BOOK_KEY),
                data.optString("mode", "spelling"),
                data.optBoolean("all", false),
                data.optInt("limit", 50)
            ));
            call.resolve(response);
        });
    }

    @PluginMethod
    public void submitAnswer(PluginCall call) {
        run(call, () -> {
            JSObject data = call.getData();
            String mode = data.optString("mode", "spelling");
            String sessionId = data.optString("sessionId", "session-default-android");
            JSObject result = store().submitAnswer(
                call.getString("wordKey"),
                call.getString("requestId"),
                call.getString("answer"),
                mode,
                sessionId,
                data.optBoolean("isNew", true),
                data.optString("outcome", ""),
                data.optString("expectedWord", "")
            );
            call.resolve(result);
        });
    }

    @PluginMethod
    public void markLearned(PluginCall call) {
        run(call, () -> call.resolve(store().markLearned(call.getString("wordKey"))));
    }

    @PluginMethod
    public void listMistakes(PluginCall call) {
        run(call, () -> {
            JSObject response = new JSObject();
            response.put("words", store().listMistakes(false, "spelling"));
            call.resolve(response);
        });
    }

    @PluginMethod
    public void getMistakeQueue(PluginCall call) {
        run(call, () -> {
            JSObject response = new JSObject();
            response.put("words", store().listMistakes(true, call.getData().optString("mode", "spelling")));
            call.resolve(response);
        });
    }

    @PluginMethod
    public void clearMistake(PluginCall call) {
        run(call, () -> call.resolve(store().clearMistake(call.getString("wordKey"))));
    }

    @PluginMethod
    public void getStats(PluginCall call) {
        run(call, () -> call.resolve(store().getGlobalStats()));
    }

    @PluginMethod
    public void getDailyStats(PluginCall call) {
        run(call, () -> {
            JSObject response = new JSObject();
            response.put("days", store().getDailyStats(call.getData().optInt("days", 90)));
            call.resolve(response);
        });
    }

    @PluginMethod
    public void getOverview(PluginCall call) {
        run(call, () -> call.resolve(store().getOverview()));
    }

    @PluginMethod
    public void getCards(PluginCall call) {
        run(call, () -> call.resolve(store().getCardCatalog()));
    }

    @PluginMethod
    public void getCardCopy(PluginCall call) {
        run(call, () -> call.resolve(store().getAvailableCardCopy()));
    }

    @PluginMethod
    public void drawCard(PluginCall call) {
        run(call, () -> call.resolve(store().drawCard()));
    }

    @PluginMethod
    public void setPlan(PluginCall call) {
        run(call, () -> call.resolve(store().setPlan(call.getString("bookKey"), call.getString("targetDate"))));
    }

    @PluginMethod
    public void clearPlan(PluginCall call) {
        run(call, () -> call.resolve(store().clearPlan(call.getString("bookKey"))));
    }

    @PluginMethod
    public void exitApp(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            call.resolve();
            getActivity().finish();
        });
    }

    private void run(PluginCall call, StoreOperation operation) {
        storageWorker.execute(() -> {
            try {
                operation.run();
            } catch (WordmasterLocalRepository.StoreException error) {
                call.reject(error.getMessage(), error.code);
            } catch (RuntimeException error) {
                call.reject("本地操作失败，请重试。", "STORAGE_UNAVAILABLE");
            }
        });
    }

    private WordmasterLocalRepository store() {
        WordmasterLocalRepository current = repository;
        if (current == null) {
            synchronized (this) {
                current = repository;
                if (current == null) repository = current = new WordmasterLocalRepository(getContext());
            }
        }
        return current;
    }

    private interface StoreOperation {
        void run();
    }
}
