# Taskify

A React Native Android task manager that turns notifications into tasks.

## Feature: Notification → Task

Using [`react-native-android-notification-listener`](https://github.com/leandrosimoes/react-native-android-notification-listener), every incoming Android notification is automatically saved as an **active task**.

### Behaviour

| Action | Result |
|---|---|
| Notification arrives | A new task is created with the notification's title & body |
| Tap a notification-task | Opens the originating app (same as tapping the original notification) |
| Long-press a task | Mark done / Archive / Delete |
| Status = `done` or `archived` | Task remains in its respective tab until explicitly deleted |

### Architecture

```
index.js
└─ registerNotificationHeadlessTask()   ← runs in background / when app is closed
   └─ addTask(task)                     ← persists to AsyncStorage

App open
└─ useNotificationListenerPermission()  ← requests "Notification Access" permission once
└─ useTasks()                           ← loads & manages tasks from AsyncStorage
└─ TaskListScreen                       ← Active / Done / Archived tabs
   └─ TaskItem
      └─ onPress → NotificationLaunchModule.launchApp(packageName)
                   ← Android native module, starts the app's launch intent
```

### Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Grant **Notification Access** when prompted (Settings → Apps → Special app access → Notification access → Taskify).

3. Run on Android:
   ```bash
   yarn android
   ```

### Native module

`NotificationLaunchModule` (Java) calls `PackageManager.getLaunchIntentForPackage()` and starts the activity with `FLAG_ACTIVITY_NEW_TASK`, which is identical to the system behaviour when a user taps a standard notification.
