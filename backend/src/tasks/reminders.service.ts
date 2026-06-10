import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    /**
     * Runs every hour to check for tasks due within the next 24 hours
     * that haven't had a reminder sent yet.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleDueDateReminders() {
        this.logger.debug('Checking for upcoming task due dates...');

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find tasks that:
        // 1. Are not DONE or CLOSED
        // 2. Have a dueDate within the next 24 hours
        // 3. Haven't had a reminder sent yet
        // 4. Have an assignee
        // 5. Are active
        const upcomingTasks = await this.prisma.task.findMany({
            where: {
                isActive: true,
                status: {
                    notIn: ['DONE', 'CLOSED'],
                },
                dueDate: {
                    gte: now,
                    lte: tomorrow,
                },
                dueDateReminderSent: false,
                assigneeId: {
                    not: null,
                },
            },
            include: {
                assignee: true,
            },
        });

        if (upcomingTasks.length === 0) {
            this.logger.debug('No upcoming tasks requiring reminders.');
            return;
        }

        this.logger.log(`Sending reminders for ${upcomingTasks.length} tasks.`);

        for (const task of upcomingTasks) {
            try {
                await this.notificationsService.dispatch({
                    recipientId: task.assigneeId!,
                    type: 'TASK_DUE_SOON',
                    entityType: 'TASK',
                    entityId: task.id,
                    payload: {
                        title: task.title,
                        dueDate: task.dueDate,
                    },
                });

                // Mark as sent
                await this.prisma.task.update({
                    where: { id: task.id },
                    data: { dueDateReminderSent: true },
                });

                this.logger.debug(`Reminder sent for task: ${task.title} (${task.id})`);
            } catch (error) {
                this.logger.error(
                    `Failed to send reminder for task ${task.id}: ${error.message}`,
                );
            }
        }
    }
}
