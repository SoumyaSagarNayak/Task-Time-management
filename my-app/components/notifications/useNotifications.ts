import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '@/lib/api';
import { notificationSocket } from '@/lib/notificationSocket';
import { Notification } from '@/lib/types';

export function useNotifications() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!isLoaded || !isSignedIn) return;

      setLoading(true);
      const token = await getToken();

      const response = await api.get('/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 50 } // Basic latest notifications
      });

      const data = response.data;
      setNotifications(data.items ?? []);
      console.log('Fetched notifications:', data);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      if (!isLoaded || !isSignedIn) return;

      const token = await getToken();
      if (token && mounted) {
        notificationSocket.connect(token, (newNotification: Notification) => {
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      notificationSocket.disconnect();
    };
  }, [getToken, isLoaded, isSignedIn]);

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      const token = await getToken();

      await api.patch(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      const token = await getToken();
      await api.patch('/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      fetchNotifications(); // Revert optimistic update
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
