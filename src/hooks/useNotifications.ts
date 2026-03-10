import {useState, useEffect, useCallback} from 'react';
import {AppState} from 'react-native';
import {
  CapturedNotification,
  loadNotifications,
  clearNotifications,
} from '../storage/notificationStorage';

export function useNotifications() {
  const [notifications, setNotifications] = useState<CapturedNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const items = await loadNotifications();
    setNotifications(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    // Refresh when the app comes back to the foreground so newly captured
    // notifications (saved by the headless task) become visible immediately.
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearNotifications();
    setNotifications([]);
  }, []);

  return {notifications, loading, refresh, clear};
}
