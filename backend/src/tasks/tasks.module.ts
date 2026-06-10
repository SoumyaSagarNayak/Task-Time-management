import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';

import { RemindersService } from './reminders.service';

@Module({
  imports: [AuthModule, NotificationsModule, ActivityModule],
  controllers: [TasksController],
  providers: [TasksService, RemindersService],
  exports: [TasksService],
})
export class TasksModule { }
