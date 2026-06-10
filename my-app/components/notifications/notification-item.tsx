import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, MessageSquare, UserPlus, FileText } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TASK_ASSIGNED':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'COMMENT_ADDED':
      case 'MENTION':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'TASK_COMPLETED':
        return <Check className="h-4 w-4 text-purple-500" />;
      case 'TASK_CREATED':
      case 'TASK_DUE_SOON':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <span className="h-4 w-4 text-gray-500">🔔</span>;
    }
  };

  const getNotificationDetails = (n: Notification) => {
    const payload = n.payload || {};
    const typeUpper = n.type.toUpperCase();

    let title = 'Notification';
    let message = 'You have a new update';

    if (typeUpper === 'TASK_ASSIGNED') {
      title = 'Task Assigned';
      message = `${payload.actorName || 'Someone'} assigned you the task "${payload.taskTitle || 'Untitled'}"`;
    } else if (typeUpper === 'TASK_UPDATED') {
      title = 'Task Updated';
      message = `The task "${payload.taskTitle || 'Untitled'}" ${payload.changeDescription || 'was updated'}`;
    } else if (typeUpper === 'MENTION') {
      title = 'Mentioned in Comment';
      message = `${payload.actorName || 'Someone'} mentioned you in a comment on "${payload.taskTitle || 'Untitled'}"`;
    } else if (typeUpper === 'TASK_DUE_SOON' || typeUpper === 'TASK_DUE') {
      title = 'Task Due Soon';
      message = `Task "${payload.title || 'Untitled'}" is due soon`;
    } else if (payload.title || payload.message) {
      title = payload.title || title;
      message = payload.message || message;
    }

    return { title, message };
  };

  const { title, message } = getNotificationDetails(notification);

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0",
        !notification.isRead && "bg-blue-50/50"
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 space-y-1">
        <p className="font-medium leading-none text-gray-900">
          {title}
        </p>
        <p className="text-xs text-gray-500">
          {message}
        </p>
        <p className="text-[10px] text-gray-400">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {!notification.isRead && (
        <button 
          onClick={() => onRead(notification.id)}
          className="flex-shrink-0 text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
          title="Mark as read"
        >
          <div className="h-2 w-2 rounded-full bg-blue-600" />
        </button>
      )}
    </div>
  );
}
