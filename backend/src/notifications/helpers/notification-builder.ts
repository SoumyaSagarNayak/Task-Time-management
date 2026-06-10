import { NotificationType } from './notification-types';

export function buildNotificationTitle(type: NotificationType): string {
  switch (type) {
    case NotificationType.TASK_CREATED:
      return 'New Task Created';
    case NotificationType.TASK_ASSIGNED:
      return 'New Task Assigned';
    case NotificationType.TASK_COMPLETED:
      return 'Task Completed';
    case NotificationType.COMMENT_ADDED:
      return 'New Comment';
    default:
      return 'Notification';
  }
}

export function buildNotificationMessage(type: NotificationType, actorName: string, entityTitle: string): string {
  switch (type) {
    case NotificationType.TASK_CREATED:
      return `${actorName} created task "${entityTitle}"`;
    case NotificationType.TASK_ASSIGNED:
      return `Task "${entityTitle}" was assigned to you`;
    case NotificationType.TASK_COMPLETED:
      return `Task "${entityTitle}" was completed`;
    case NotificationType.COMMENT_ADDED:
      return `${actorName} commented on "${entityTitle}"`;
    default:
      return 'You have a new notification';
  }
}
