import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private activityService: ActivityService,
    ) { }

    private async validateTaskAccess(taskId: string, user: CurrentUserData) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { isActive: true },
        });

        if (!task || !task.isActive) {
            throw new NotFoundException(`Task with ID ${taskId} not found`);
        }

        return task;
    }

    async getCommentsByTask(
        taskId: string,
        user: CurrentUserData,
    ): Promise<CommentResponseDto[]> {
        await this.validateTaskAccess(taskId, user);

        const comments = await this.prisma.comment.findMany({
            where: { taskId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: true,
            },
        });

        return comments.map((c) => CommentResponseDto.from(c));
    }

    async createComment(
        taskId: string,
        userId: string,
        dto: CreateCommentDto,
        user: CurrentUserData,
    ): Promise<CommentResponseDto> {
        await this.validateTaskAccess(taskId, user);

        const comment = await this.prisma.comment.create({
            data: {
                body: dto.body,
                taskId,
                userId,
            },
            include: {
                user: true,
                task: true,
            },
        });

        // Extract mentions: e.g., @John or @jane
        const mentions = dto.body.match(/@(\w+)/g);
        if (mentions && mentions.length > 0) {
            const firstNames = mentions.map(m => m.substring(1));

            // Find users matching those first names globally
            const mentionedUsers = await this.prisma.user.findMany({
                where: {
                    firstName: { in: firstNames, mode: 'insensitive' },
                    isActive: true,
                }
            });

            // Dispatch notifications
            const actorName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Someone';
            const dispatchPromises = mentionedUsers
                .filter(mu => mu.id !== user.id) // don't notify self
                .map(mu =>
                    this.notificationsService.dispatch({
                        recipientId: mu.id,
                        actorId: user.id,
                        type: 'mention',
                        entityType: 'comment',
                        entityId: comment.id,
                        payload: {
                            taskTitle: comment.task.title,
                            actorName,
                        },
                    })
                );

            await Promise.all(dispatchPromises);
        }

        return CommentResponseDto.from(comment);
    }

    async deleteComment(commentId: string, user: CurrentUserData): Promise<void> {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                task: {
                    select: { title: true },
                },
            },
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        // Authorization check: Self or Admin
        const isAuthor = comment.userId === user.id;
        const canDeleteAny = user.role === 'ADMIN';

        if (!isAuthor && !canDeleteAny) {
            throw new ForbiddenException(
                'You are not authorized to delete this comment',
            );
        }

        await this.prisma.comment.delete({
            where: { id: commentId },
        });

        await this.activityService.log({
            userId: user.id,
            action: 'COMMENT_DELETED',
            entityType: 'COMMENT',
            entityId: commentId,
            metadata: { taskId: comment.taskId, taskTitle: comment.task.title },
        });
    }
}
