import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
    Sse,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { NotificationsService } from './notifications.service';
import { Observable } from 'rxjs';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * SSE Stream endpoint as a fallback for WebSockets
     */
    @Sse('stream')
    sse(@Request() req): Observable<MessageEvent> {
        const userId = req.user.id;
        return this.notificationsService.createSseStream(userId);
    }

    /**
     * Get paginated notifications feed
     */
    @Get()
    async getFeed(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 20;

        return this.notificationsService.findForUser(req.user.id, pageNumber, limitNumber);
    }

    /**
     * Get unread notifications count
     */
    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.unreadCount(req.user.id);
        return { count };
    }

    /**
     * Mark all notifications as read for current user
     */
    @Patch('read-all')
    async markAllRead(@Request() req) {
        await this.notificationsService.markRead(req.user.id);
        return { success: true };
    }

    /**
     * Mark a single notification as read
     */
    @Patch(':id/read')
    async markRead(@Request() req, @Param('id') notificationId: string) {
        await this.notificationsService.markRead(req.user.id, notificationId);
        return { success: true };
    }
}
