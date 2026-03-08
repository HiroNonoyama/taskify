/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {registerNotificationHeadlessTask} from './src/hooks/useNotificationListener';
import {addTask} from './src/storage/taskStorage';

// Register the headless JS task so that incoming notifications are persisted
// to storage even when the app is in the background or closed.
registerNotificationHeadlessTask(task => {
  addTask(task);
});

AppRegistry.registerComponent(appName, () => App);
