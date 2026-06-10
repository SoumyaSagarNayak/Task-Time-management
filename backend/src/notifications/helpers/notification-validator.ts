import { BadRequestException } from '@nestjs/common';
import { NotificationType } from './notification-types';

export function validateUserId(userId: string) {
  if (!userId || typeof userId !== 'string') {
    throw new BadRequestException('Invalid userId provided for notification');
  }
}

export function validateNotificationType(type: any): type is NotificationType {
  const validTypes = Object.values(NotificationType);
  if (!validTypes.includes(type)) {
    throw new BadRequestException(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
  }
  return true;
}

export function validateNotificationId(id: string) {
  if (!id || typeof id !== 'string') {
    throw new BadRequestException('Invalid notification ID');
  }
}
