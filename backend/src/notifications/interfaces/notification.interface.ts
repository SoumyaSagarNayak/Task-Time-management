export interface INotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  metadata?: any;
}
