export type TaskStatus = 'active' | 'done' | 'archived';

export interface NotificationInfo {
  /** Package name of the app that sent the notification */
  packageName: string;
  /** Title of the notification */
  title: string;
  /** Body text of the notification */
  text: string;
  /** Notification ID used to replay the tap action */
  notificationId?: string;
  /** Extras from the notification (serialized JSON) */
  extras?: string;
}

export interface Task {
  id: string;
  title: string;
  body: string;
  status: TaskStatus;
  createdAt: number;
  /** Present when this task was created from an Android notification */
  notification?: NotificationInfo;
}
