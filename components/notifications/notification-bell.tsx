'use client';

import React, { useState } from 'react';
import { useNotifications } from './useNotifications';
import { NotificationDropdown } from './notification-dropdown';
import { Bell } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-1" align="end">
        <NotificationDropdown 
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllAsRead}
        />
      </PopoverContent>
    </Popover>
  );
}
