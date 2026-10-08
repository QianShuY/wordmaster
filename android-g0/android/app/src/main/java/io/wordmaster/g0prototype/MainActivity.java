package io.wordmaster.g0prototype;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(WordmasterStorePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onBackPressed() {
        if (getBridge() == null) {
            super.onBackPressed();
            return;
        }
        getBridge().triggerWindowJSEvent("androidback");
    }
}
