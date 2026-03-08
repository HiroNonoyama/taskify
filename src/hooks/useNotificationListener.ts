import {useEffect} from 'react';
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from 'react-native-android-notification-listener';
import {AppRegistry, Platform} from 'react-native';
import {Task, NotificationInfo} from '../types';
import {v4 as uuidv4} from 'uuid';

type NotificationHandler = (task: Task) => void;

/**
 * Payload shape forwarded by the headless JS task from
 * react-native-android-notification-listener.
 */
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

function buildTaskFromNotification(raw: RawNotification): Task {
  const title = raw.titleBig ?? raw.title ?? raw.app ?? 'Notification';
  const body =
    raw.bigText ?? raw.text ?? raw.subText ?? raw.summaryText ?? '';

  const notificationInfo: NotificationInfo = {
    packageName: raw.app,
    title: title,
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
    notification: notificationInfo,
  };
}

/**
 * Registers the headless JS task for background notification processing.
 * Must be called once, typically in index.js / App.tsx before component mount.
 */
export function registerNotificationHeadlessTask(
  onNotification: NotificationHandler,
): void {
  if (Platform.OS !== 'android') {
    return;
  }

  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () =>
      async (notification: RawNotification) => {
        const task = buildTaskFromNotification(notification);
        onNotification(task);
      },
  );
}

/**
 * React hook that requests notification listener permission on mount.
 * The actual task creation is handled by the headless task registered via
 * registerNotificationHeadlessTask().
 */
export function useNotificationListenerPermission(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    RNAndroidNotificationListener.getPermissionStatus().then(
      (status: string) => {
        if (status !== 'authorized') {
          // Opens the Android Notification Listener Settings page so the user
          // can grant permission. We only do this once per session to avoid
          // being intrusive.
          RNAndroidNotificationListener.requestPermission();
        }
      },
    );
  }, []);
}
