import { io, Socket } from 'socket.io-client';
import { Notification } from './types';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class NotificationSocket {
  private socket: Socket | null = null;
  
  connect(token: string, onNotification: (notif: Notification) => void) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      // Socket resilience features
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification service');
    });

    this.socket.on('receive_notification', (data) => {
      onNotification(data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from notification service:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const notificationSocket = new NotificationSocket();
