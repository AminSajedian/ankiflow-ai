package com.yourcompany.ankiflowai;

import android.content.Intent;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class IntentModule extends ReactContextBaseJavaModule {
    public IntentModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "IntentLauncher";
    }

    @ReactMethod
    public void startActivity(ReadableMap intentMap, Promise promise) {
        try {
            Intent intent = new Intent(intentMap.getString("action"));
            // Add extras from the map
            ReadableMap extras = intentMap.getMap("extras");
            if (extras != null) {
                intent.putExtra("api_version", extras.getInt("api_version"));
                intent.putExtra("action", extras.getString("action"));
                // Add other extras as needed
            }
            getCurrentActivity().startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
