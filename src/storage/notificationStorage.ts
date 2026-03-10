import AsyncStorage from '@react-native-async-storage/async-storage';
import {NotificationInfo} from '../types';

const NOTIFICATIONS_KEY = '@taskify/notifications';
const MAX_NOTIFICATIONS = 200;

export interface CapturedNotification {
  id: string;
  receivedAt: number;
  notification: NotificationInfo;
}

export async function loadNotifications(): Promise<CapturedNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as CapturedNotification[];
  } catch {
    return [];
  }
}

export async function addNotification(
  item: CapturedNotification,
): Promise<CapturedNotification[]> {
  const existing = await loadNotifications();
  const updated = [item, ...existing].slice(0, MAX_NOTIFICATIONS);
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
}
