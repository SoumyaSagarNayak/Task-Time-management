import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async getTimeByTask(startDate: Date, endDate: Date) {
        const timeEntries = await this.prisma.timeEntry.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
            },
            include: {
                tasks: true,
            },
        });

        const taskMap = new Map<string, { taskId: string; taskName: string; totalHours: number; billable: boolean }>();

        for (const entry of timeEntries) {
            if (entry.tasks.length === 0) continue;

            const hoursPerTask = entry.hours / entry.tasks.length;

            for (const task of entry.tasks) {
                if (!taskMap.has(task.id)) {
                    taskMap.set(task.id, {
                        taskId: task.id,
                        taskName: task.title,
                        totalHours: 0,
                        billable: entry.isBillable,
                    });
                }
                taskMap.get(task.id)!.totalHours += hoursPerTask;
            }
        }

        return Array.from(taskMap.values())
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 50); // Optional limit
    }

    private getBucketKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
        const d = new Date(date);
        if (groupBy === 'day') {
            return d.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else { // week
            // Simple ISO week logic approx
            const dt = new Date(d.getTime());
            dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        }
    }

    async getUserProductivity(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month') {
        const timeEntries = await this.prisma.timeEntry.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
            },
            include: {
                user: true,
            },
            orderBy: { startTime: 'asc' },
        });

        const userMap = new Map<string, {
            userId: string;
            userName: string;
            buckets: Map<string, number>;
        }>();

        for (const entry of timeEntries) {
            if (!userMap.has(entry.userId)) {
                userMap.set(entry.userId, {
                    userId: entry.userId,
                    userName: `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim() || entry.user.email,
                    buckets: new Map<string, number>(),
                });
            }

            const userData = userMap.get(entry.userId)!;
            const bucket = this.getBucketKey(entry.startTime, groupBy);

            userData.buckets.set(bucket, (userData.buckets.get(bucket) || 0) + entry.hours);
        }

        return Array.from(userMap.values()).map(user => ({
            userId: user.userId,
            userName: user.userName,
            buckets: Array.from(user.buckets.entries()).map(([period, hours]) => ({ period, hours })),
        }));
    }

    async getBillableVsNonBillable(startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month') {
        const timeEntries = await this.prisma.timeEntry.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
            },
            orderBy: { startTime: 'asc' },
        });

        const bucketMap = new Map<string, { billable: number; nonBillable: number }>();

        for (const entry of timeEntries) {
            const bucket = this.getBucketKey(entry.startTime, groupBy);
            if (!bucketMap.has(bucket)) {
                bucketMap.set(bucket, { billable: 0, nonBillable: 0 });
            }

            const data = bucketMap.get(bucket)!;
            if (entry.isBillable) {
                data.billable += entry.hours;
            } else {
                data.nonBillable += entry.hours;
            }
        }

        return Array.from(bucketMap.entries()).map(([period, data]) => ({
            period,
            ...data,
        }));
    }

    async getSummary(startDate: Date, endDate: Date) {
        const timeEntries = await this.prisma.timeEntry.findMany({
            where: {
                startTime: { gte: startDate },
                endTime: { lte: endDate },
            },
            include: { tasks: true }
        });

        let totalHours = 0;
        let billableHours = 0;
        const activeUserIds = new Set<string>();
        const activeTaskIds = new Set<string>();

        for (const entry of timeEntries) {
            totalHours += entry.hours;
            if (entry.isBillable) billableHours += entry.hours;
            activeUserIds.add(entry.userId);
            entry.tasks.forEach(t => activeTaskIds.add(t.id));
        }

        const nonBillableHours = totalHours - billableHours;
        const billablePercentage = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

        // Avg daily hours logic approx across workdays in period (or total days)
        const daysInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const avgDailyHours = activeUserIds.size > 0 ? (totalHours / activeUserIds.size / daysInPeriod) : 0;

        return {
            totalHours,
            billableHours,
            nonBillableHours,
            billablePercentage: Number(billablePercentage.toFixed(2)),
            activeUsers: activeUserIds.size,
            activeTasks: activeTaskIds.size,
            avgDailyHours: Number(avgDailyHours.toFixed(2)),
        };
    }
}
