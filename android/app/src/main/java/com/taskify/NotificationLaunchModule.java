package com.taskify;

import android.content.Intent;
import android.content.pm.PackageManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Exposes a single method – launchApp(packageName) – that starts the main
 * activity of the given package, exactly replicating the tap-on-notification
 * behaviour on Android.
 */
public class NotificationLaunchModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public NotificationLaunchModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "NotificationLaunchModule";
    }

    /**
     * Launch the app identified by {@code packageName}.
     *
     * @param packageName Android package name (e.g. "com.slack")
     * @param promise     Resolved on success, rejected with a message on failure.
     */
    @ReactMethod
    public void launchApp(String packageName, Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            Intent launchIntent = pm.getLaunchIntentForPackage(packageName);

            if (launchIntent == null) {
                promise.reject("NO_LAUNCH_INTENT",
                        "No launch intent found for package: " + packageName);
                return;
            }

            // Bring the existing task to the foreground when available,
            // which mirrors Android's default notification tap behaviour.
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            reactContext.startActivity(launchIntent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("LAUNCH_FAILED", e.getMessage(), e);
        }
    }
}
