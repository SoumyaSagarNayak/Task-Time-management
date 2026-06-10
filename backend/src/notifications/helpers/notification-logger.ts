import { Logger } from '@nestjs/common';

const logger = new Logger('NotificationSystem');

/**
 * Log notification events for better debugging and tracing
 */
export const NotificationLogger = {
  logCreated(id: string, userId: string, type: string) {
    logger.log(`[Created] Notification ${id} for user ${userId} of type ${type}`);
  },

  logEmitted(userId: string, eventName: string) {
    logger.log(`[Emitted] WebSocket event '${eventName}' to user ${userId}`);
  },

  logRead(id: string, userId: string) {
    logger.log(`[Read] Notification ${id} marked read by user ${userId}`);
  },

  logError(action: string, error: any) {
    logger.error(`[Error] Failed to ${action}: ${error.message || error}`, error.stack);
  },
  
  logConnection(userId: string, socketId: string) {
    logger.log(`[Connected] User ${userId} via socket ${socketId}`);
  },

  logDisconnection(userId: string, socketId: string) {
    logger.log(`[Disconnected] User ${userId} via socket ${socketId}`);
  }
};
