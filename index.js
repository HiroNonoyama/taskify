/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {
  registerNotificationHeadlessTask,
  registerNotifeeBackgroundHandler,
} from './src/hooks/useNotificationListener';

// Handle Notifee action button presses while the app is in the background
// or closed.  Must be called before AppRegistry.registerComponent.
registerNotifeeBackgroundHandler();

// Listen for incoming notifications and show a prompt notification so the
// user can explicitly choose to add them as tasks.
registerNotificationHeadlessTask();

AppRegistry.registerComponent(appName, () => App);
