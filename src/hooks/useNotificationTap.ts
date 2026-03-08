import {useCallback} from 'react';
import {NativeModules, Platform, Alert} from 'react-native';
import {NotificationInfo} from '../types';

/**
 * Returns a function that, when called with a NotificationInfo, launches the
 * originating app's activity exactly as if the user had tapped the original
 * notification.
 *
 * On Android we use the custom NativeModule (NotificationLaunchModule) that
 * calls Context.startActivity() with a launch-intent for the package, which
 * mirrors the behaviour of tapping the notification.
 */
export function useNotificationTap() {
  const launch = useCallback((notification: NotificationInfo) => {
    if (Platform.OS !== 'android') {
      return;
    }

    const {NotificationLaunchModule} = NativeModules;

    if (!NotificationLaunchModule) {
      Alert.alert(
        'Not supported',
        'NotificationLaunchModule is not available on this build.',
      );
      return;
    }

    NotificationLaunchModule.launchApp(notification.packageName).catch(
      (err: Error) => {
        Alert.alert('Could not open app', err.message);
      },
    );
  }, []);

  return launch;
}
