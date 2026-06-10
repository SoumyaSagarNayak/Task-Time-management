import React from 'react';
import { Notification } from '@/lib/types';
import { NotificationItem } from './notification-item';
import { CheckCheck, BellOff } from 'lucide-react';
import { Button } from '../ui/button';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({ 
  notifications, 
  unreadCount, 
  loading,
  onMarkRead, 
  onMarkAllRead 
}: NotificationDropdownProps) {
  
  return (
    <div className="w-80 flex flex-col max-h-[400px]">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMarkAllRead}
            className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 bg-white">
        {loading && notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onRead={onMarkRead} 
            />
          ))
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
            <BellOff className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
