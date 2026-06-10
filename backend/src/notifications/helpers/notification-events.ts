import { NotificationType } from './notification-types';
import { INotificationPayload } from '../interfaces/notification.interface';

// Event Constants
export const TASK_CREATED = NotificationType.TASK_CREATED;
export const TASK_ASSIGNED = NotificationType.TASK_ASSIGNED;
export const TASK_COMPLETED = NotificationType.TASK_COMPLETED;
export const COMMENT_ADDED = NotificationType.COMMENT_ADDED;

/**
 * Helper to build a standard notification payload
 */
export function buildNotificationPayload(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string,
  metadata?: any,
): INotificationPayload {
  return {
    userId,
    type,
    title,
    message,
    relatedId,
    metadata,
  };
}
