// Activity service for logging global audit actions
import { Injectable } from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ActivityService {
    constructor(private prisma: PrismaService) { }

    async log(params: {
        userId: string;
        action: string;
        entityType: string;
        entityId?: string;
        metadata?: Record<string, any>;
    }) {
        return this.prisma.activityLog.create({
            data: {
                userId: params.userId,
                action: params.action as ActivityAction,
                entityType: params.entityType,
                entityId: params.entityId || null,
                metadata: params.metadata || {},
            },
        });
    }

    async findAll(query: QueryActivityDto, user: CurrentUserData) {
        const { action, entityType, userId, startDate, endDate, page = 1, limit = 30 } = query;
        const where: any = {};

        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [items, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            }),
            this.prisma.activityLog.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async exportCsv(query: QueryActivityDto, user: CurrentUserData): Promise<string> {
        const { action, entityType, userId, startDate, endDate } = query;
        const where: any = {};

        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const logs = await this.prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 5000,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });

        const header = 'Date,User,Email,Action,Entity Type,Entity ID,Details';
        const rows = logs.map((log) => {
            const name = log.user 
                ? [log.user.firstName, log.user.lastName].filter(Boolean).join(' ') 
                : 'System';
            const email = log.user?.email || 'N/A';
            const meta = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : '';
            
            return [
                log.createdAt.toISOString(),
                `"${name}"`,
                email,
                log.action,
                log.entityType,
                log.entityId || '',
                `"${meta}"`,
            ].join(',');
        });

        return [header, ...rows].join('\n');
    }
}
