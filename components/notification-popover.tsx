'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    fetchNotifications,
    fetchUnreadNotificationCount,
    markNotificationRead
} from '@/lib/api';
import { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';

export function NotificationPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchNotifications(1, 10);
            setNotifications(data.items);
            const countData = await fetchUnreadNotificationCount();
            setUnreadCount(countData.count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
        // Refresh every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const handleMarkRead = async (id?: string) => {
        try {
            await markNotificationRead(id);
            if (id) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'TASK_DUE_SOON':
                return <Clock className="h-4 w-4 text-amber-500" />;
            case 'mention':
                return <Info className="h-4 w-4 text-blue-500" />;
            case 'task_updated':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTitle = (notification: Notification) => {
        switch (notification.type) {
            case 'TASK_DUE_SOON':
                return 'Task Due Soon';
            case 'mention':
                return 'You were mentioned';
            case 'task_updated':
                return 'Task Updated';
            default:
                return 'Notification';
        }
    };

    const getContent = (notification: Notification) => {
        const { payload } = notification;
        switch (notification.type) {
            case 'TASK_DUE_SOON':
                return `Task "${payload.title}" is due ${formatDistanceToNow(new Date(payload.dueDate), { addSuffix: true })}`;
            case 'mention':
                return `${payload.actorName} mentioned you in a comment on "${payload.taskTitle}"`;
            case 'task_updated':
                return `Task "${payload.taskTitle}": ${payload.changeDescription}`;
            default:
                return 'You have a new notification';
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-gray-200 dark:border-gray-800" align="end">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-4">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            onClick={() => handleMarkRead()}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {loading && notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">No notifications</div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-gray-800">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-3 p-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                        !notification.isRead && "bg-blue-50/30 dark:bg-blue-900/10"
                                    )}
                                    onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                                >
                                    <div className="mt-1">
                                        {notification.actor ? (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={notification.actor.avatarUrl} />
                                                <AvatarFallback className="text-[10px]">
                                                    {notification.actor.firstName?.[0] || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                                {getIcon(notification.type)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between">
                                            <p className={cn(
                                                "text-xs font-medium",
                                                !notification.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"
                                            )}>
                                                {getTitle(notification)}
                                            </p>
                                            <span className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-gray-500 line-clamp-2">
                                            {getContent(notification)}
                                        </p>
                                        {!notification.isRead && (
                                            <div className="flex justify-end pt-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 p-2 text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
