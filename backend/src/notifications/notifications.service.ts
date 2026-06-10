import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';
import { Subject, Observable } from 'rxjs';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationsService {
    // Map of userId to RxJS Subject for SSE streams
    private sseClients = new Map<string, Subject<MessageEvent>>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: NotificationsGateway,
    ) { }

    /**
     * Persists a notification to the DB and pushes it to Connected WebSockets + SSE
     */
    async dispatch(dto: CreateNotificationDto): Promise<Notification> {
        // 1. Persist to DB
        const notification = await this.prisma.notification.create({
            data: {
                recipientId: dto.recipientId,
                actorId: dto.actorId,
                type: dto.type,
                entityType: dto.entityType,
                entityId: dto.entityId,
                payload: dto.payload || {},
            },
            include: {
                actor: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });

        // 2. Push via WebSocket Gateway
        this.gateway.pushToUser(dto.recipientId, 'notification:new', notification);

        // 3. Push to Active SSE Streams
        const subject = this.sseClients.get(dto.recipientId);
        if (subject) {
            subject.next({ data: notification } as MessageEvent);
        }

        return notification;
    }

    /**
     * Get paginated notifications for a user
     */
    async findForUser(userId: string, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { recipientId: userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    actor: {
                        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                    },
                },
            }),
            this.prisma.notification.count({
                where: { recipientId: userId },
            }),
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + items.length < total,
        };
    }

    /**
     * Get unread notification count for a user
     */
    async unreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                recipientId: userId,
                isRead: false,
            },
        });
    }

    /**
     * Mark a single notification or all notifications as read
     */
    async markRead(userId: string, notificationId?: string): Promise<void> {
        if (notificationId) {
            // Mark single as read
            await this.prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    recipientId: userId,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        } else {
            // Mark all as read
            await this.prisma.notification.updateMany({
                where: {
                    recipientId: userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
        }
    }

    /**
     * Create an SSE stream for a specific user
     */
    createSseStream(userId: string): Observable<MessageEvent> {
        if (!this.sseClients.has(userId)) {
            this.sseClients.set(userId, new Subject<MessageEvent>());
        }
        return this.sseClients.get(userId)!.asObservable();
    }
}
