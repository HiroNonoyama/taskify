import {useEffect} from 'react';
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from 'react-native-android-notification-listener';
import {AppRegistry, Platform} from 'react-native';
import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import {Task, NotificationInfo} from '../types';
import {v4 as uuidv4} from 'uuid';
import {addTask} from '../storage/taskStorage';

/** Payload shape from react-native-android-notification-listener */
interface RawNotification {
  app: string;
  title?: string;
  titleBig?: string;
  text?: string;
  subText?: string;
  summaryText?: string;
  bigText?: string;
  packageName?: string;
  notificationId?: string;
  extras?: string;
}

// ─── Notifee channel / action IDs ────────────────────────────────────────────

const CHANNEL_ID = 'taskify_prompt';
const ACTION_ADD = 'ACTION_ADD_TASK';
const ACTION_DISMISS = 'ACTION_DISMISS';

/** Key used to pass serialised pending-task data in the Notifee notification. */
const PENDING_TASK_KEY = 'pendingTask';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTaskFromRaw(raw: RawNotification): Task {
  const title = raw.titleBig ?? raw.title ?? raw.app ?? 'Notification';
  const body =
    raw.bigText ?? raw.text ?? raw.subText ?? raw.summaryText ?? '';

  const notification: NotificationInfo = {
    packageName: raw.app,
    title,
    text: body,
    notificationId: raw.notificationId,
    extras: raw.extras,
  };

  return {
    id: uuidv4(),
    title,
    body,
    status: 'active',
    createdAt: Date.now(),
    notification,
  };
}

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Task prompts',
    importance: AndroidImportance.HIGH,
  });
}

/**
 * Posts a Taskify prompt notification with [タスクに追加] / [閉じる] action
 * buttons so the user can explicitly decide whether to add the notification
 * as a task.
 */
async function postPromptNotification(raw: RawNotification): Promise<void> {
  await ensureChannel();

  const task = buildTaskFromRaw(raw);
  const appLabel = raw.app.split('.').pop() ?? raw.app;

  await notifee.displayNotification({
    title: `📋 タスクに追加しますか？`,
    body: `[${appLabel}] ${task.title}`,
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_launcher',
      pressAction: {id: 'default'},
      actions: [
        {
          title: 'タスクに追加',
          pressAction: {id: ACTION_ADD},
        },
        {
          title: '閉じる',
          pressAction: {id: ACTION_DISMISS},
        },
      ],
      // Embed the pending task so we can reconstruct it in the background handler
      // without any shared state.
      data: {
        [PENDING_TASK_KEY]: JSON.stringify(task),
      },
    },
  });
}

// ─── Background event handler (runs when app is closed / in background) ──────

/**
 * Must be called once in index.js (before AppRegistry.registerComponent).
 * Handles Notifee action button presses in the background.
 */
export function registerNotifeeBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({type, detail}) => {
    const {notification, pressAction} = detail;

    if (!notification || !pressAction) {
      return;
    }

    if (pressAction.id === ACTION_ADD) {
      const raw = notification.android?.data?.[PENDING_TASK_KEY];
      if (raw) {
        const task: Task = JSON.parse(raw as string);
        await addTask(task);
      }
      await notifee.cancelNotification(notification.id!);
    }

    if (pressAction.id === ACTION_DISMISS) {
      await notifee.cancelNotification(notification.id!);
    }
  });
}

// ─── Foreground event hook ────────────────────────────────────────────────────

/**
 * React hook that handles Notifee action button presses while the app is in
 * the foreground, and requests notification posting permission (Android 13+).
 */
export function useNotifeeEvents(onTaskAdded?: (task: Task) => void): void {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // Request POST_NOTIFICATIONS permission (Android 13+)
    notifee.requestPermission();

    const unsubscribe = notifee.onForegroundEvent(async ({type, detail}) => {
      if (type !== EventType.ACTION_PRESS) {
        return;
      }

      const {notification, pressAction} = detail;
      if (!notification || !pressAction) {
        return;
      }

      if (pressAction.id === ACTION_ADD) {
        const raw = notification.android?.data?.[PENDING_TASK_KEY];
        if (raw) {
          const task: Task = JSON.parse(raw as string);
          await addTask(task);
          onTaskAdded?.(task);
        }
        await notifee.cancelNotification(notification.id!);
      }

      if (pressAction.id === ACTION_DISMISS) {
        await notifee.cancelNotification(notification.id!);
      }
    });

    return unsubscribe;
  }, [onTaskAdded]);
}

// ─── Notification listener registration ──────────────────────────────────────

/**
 * Registers the react-native-android-notification-listener headless JS task.
 * Instead of auto-saving, it posts a Notifee prompt notification so the user
 * can explicitly choose to add it as a task from the notification shade.
 *
 * Must be called once in index.js before AppRegistry.registerComponent.
 */
export function registerNotificationHeadlessTask(): void {
  if (Platform.OS !== 'android') {
    return;
  }

  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () =>
      async (notification: RawNotification) => {
        // Skip Taskify's own prompt notifications to avoid infinite loops.
        if (notification.app === 'com.taskify') {
          return;
        }
        await postPromptNotification(notification);
      },
  );
}

// ─── Notification listener permission hook ───────────────────────────────────

/**
 * Requests the Android "Notification Access" permission (to read other apps'
 * notifications) once per session.
 */
export function useNotificationListenerPermission(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    RNAndroidNotificationListener.getPermissionStatus().then(
      (status: string) => {
        if (status !== 'authorized') {
          RNAndroidNotificationListener.requestPermission();
        }
      },
    );
  }, []);
}
