import { Notification } from './types';

class NotificationSocket {
  connect(token: string, onNotification: (notif: Notification) => void) {
    console.log('Mock notification socket connected');
    
    if (typeof window !== 'undefined') {
      const handleMockNotification = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          onNotification(customEvent.detail);
        }
      };
      // Allow components to trigger notifications locally by dispatching custom events
      window.addEventListener('mock_notification', handleMockNotification);
    }
  }

  disconnect() {
    console.log('Mock notification socket disconnected');
  }
}

export const notificationSocket = new NotificationSocket();

