import PDFDocument from 'pdfkit';
import { Parser as Json2CsvParser } from 'json2csv';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private activityService: ActivityService,
  ) { }

  async create(createTaskDto: CreateTaskDto, user: CurrentUserData) {
    const {
      assigneeId: initialAssigneeId,
      tagIds,
      dueDate,
      ...taskData
    } = createTaskDto;
    let assigneeId = initialAssigneeId;

    // Convert dueDate string to DateTime if provided
    let dueDateValue: Date | null | undefined;
    if (dueDate) {
      if (dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dueDateValue = new Date(dueDate + 'T00:00:00Z');
      } else {
        dueDateValue = new Date(dueDate);
      }

      if (isNaN(dueDateValue.getTime())) {
        throw new BadRequestException(
          'Invalid dueDate format. Expected ISO-8601 DateTime or YYYY-MM-DD date.',
        );
      }
    }

    if (assigneeId) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: assigneeId },
      });
      if (!assignedUser || !assignedUser.isActive) {
        throw new BadRequestException(
          'Cannot assign task to inactive or non-existent user',
        );
      }
    } else {
      if (user.role === 'MEMBER') {
        assigneeId = user.id;
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        estimatedHours: taskData.estimatedHours,
        boardOrder: 0,
        ...(dueDateValue && { dueDate: dueDateValue }),
        ...(assigneeId && { assigneeId }),
        ...(tagIds && tagIds.length > 0 && {
          tags: {
            connect: tagIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        tags: true,
      },
    });

    return task;
  }

  async exportPDF(query: QueryTasksDto, user: CurrentUserData): Promise<Buffer> {
    const tasks = await this.findAll({ ...query, page: 1, limit: 10000 }, user);
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.fontSize(18).text('Tasks', { align: 'center' });
    doc.moveDown();
    if (!tasks.length) {
      doc.text('No tasks found.');
    } else {
      tasks.forEach((t, i) => {
        doc.fontSize(12).text(`#${i + 1}`);
        doc.text(`Title: ${t.title}`);
        doc.text(`Status: ${t.status}`);
        doc.text(`Priority: ${t.priority}`);
        doc.text(`Description: ${t.description || ''}`);
        doc.moveDown();
      });
    }
    doc.end();
    return await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  async exportCSV(query: QueryTasksDto, user: CurrentUserData) {
    const tasks = await this.findAll({ ...query, page: 1, limit: 10000 }, user);
    if (!tasks.length) return '';
    const data = tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      description: t.description,
      estimatedHours: t.estimatedHours,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
    }));
    const fields = Object.keys(data[0]);
    const parser = new Json2CsvParser({ fields });
    return parser.parse(data);
  }

  async findAll(query: QueryTasksDto, user: CurrentUserData) {
    const { status, priority, assignedToId, search, tagIds, page = 1, limit = 10 } = query;

    const where: Record<string, any> = {
      isActive: true,
    };

    if (user.role === 'MEMBER') {
      where.assigneeId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      if (user.role === 'MEMBER' && assignedToId !== user.id) {
        throw new ForbiddenException(
          'As a member, you can only view tasks assigned to yourself.',
        );
      }
      where.assigneeId = assignedToId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          id: { in: Array.isArray(tagIds) ? tagIds : [tagIds] },
        },
      };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        tags: true,
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tags: true,
        blockedBy: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        blocks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { startTime: 'desc' },
        },
      },
    });

    if (!task || !task.isActive) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: CurrentUserData,
  ) {
    const task = await this.findOne(id);

    if (user.role === 'MEMBER' && task.assigneeId !== user.id) {
      throw new ForbiddenException(
        'You can only update tasks assigned to you',
      );
    }

    const { assigneeId, tagIds, dueDate, ...taskData } = updateTaskDto;

    // Convert dueDate string to DateTime if provided
    let dueDateValue: Date | null | undefined;
    if (dueDate !== undefined) {
      if (dueDate === null) {
        dueDateValue = null;
      } else {
        if (
          typeof dueDate === 'string' &&
          dueDate.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          dueDateValue = new Date(dueDate + 'T00:00:00Z');
        } else if (typeof dueDate === 'string') {
          dueDateValue = new Date(dueDate);
        } else {
          dueDateValue = dueDate as Date;
        }

        if (dueDateValue && isNaN(dueDateValue.getTime())) {
          throw new BadRequestException(
            'Invalid dueDate format. Expected ISO-8601 DateTime or YYYY-MM-DD date.',
          );
        }
      }
    }

    // Validate assigned user if provided
    if (assigneeId !== undefined) {
      if (user.role === 'MEMBER') {
        if (assigneeId !== null && assigneeId !== user.id) {
          throw new ForbiddenException('You can only assign tasks to yourself');
        }
      } else {
        if (assigneeId !== null) {
          const assignedUser = await this.prisma.user.findUnique({
            where: { id: assigneeId },
          });
          if (!assignedUser || !assignedUser.isActive) {
            throw new BadRequestException('Assignee not found or inactive');
          }
        }
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...(taskData.title !== undefined && { title: taskData.title }),
        ...(taskData.description !== undefined && {
          description: taskData.description,
        }),
        ...(taskData.status !== undefined && { status: taskData.status }),
        ...(taskData.priority !== undefined && { priority: taskData.priority }),
        ...(taskData.estimatedHours !== undefined && {
          estimatedHours: taskData.estimatedHours,
        }),
        ...(dueDate !== undefined && { dueDate: dueDateValue }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(tagIds !== undefined && {
          tags: {
            set: tagIds.length > 0
              ? tagIds.map((id) => ({ id }))
              : [],
          },
        }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        tags: true,
      },
    });

    // Notify about assignment change
    if (assigneeId !== undefined && updatedTask.assigneeId && updatedTask.assigneeId !== user.id && updatedTask.assigneeId !== task.assigneeId) {
      this.notificationsService.dispatch({
        recipientId: updatedTask.assigneeId,
        actorId: user.id,
        type: 'task_assigned',
        entityType: 'task',
        entityId: updatedTask.id,
        payload: {
          taskTitle: updatedTask.title,
          actorName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Someone',
        },
      });
    } else if (taskData.title || taskData.description || taskData.priority || dueDate !== undefined) {
      if (updatedTask.assigneeId && updatedTask.assigneeId !== user.id) {
        this.notificationsService.dispatch({
          recipientId: updatedTask.assigneeId,
          actorId: user.id,
          type: 'task_updated',
          entityType: 'task',
          entityId: updatedTask.id,
          payload: {
            taskTitle: updatedTask.title,
            changeDescription: 'had its details updated',
          },
        });
      }
    }

    return updatedTask;
  }

  async remove(id: string, user?: CurrentUserData) {
    const task = await this.findOne(id);

    const result = await this.prisma.task.update({
      where: { id },
      data: { isActive: false },
    });

    return result;
  }

  async bulkRemove(ids: string[], user: CurrentUserData) {
    const result = await this.prisma.task.updateMany({
      where: {
        id: { in: ids },
        ...(user.role === 'MEMBER' && { assigneeId: user.id }),
      },
      data: { isActive: false },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'TASK_DELETED',
      entityType: 'TASK',
      metadata: { count: ids.length, ids },
    });

    return result;
  }

  async bulkUpdateStatus(ids: string[], status: TaskStatus, user: CurrentUserData) {
    const result = await this.prisma.task.updateMany({
      where: {
        id: { in: ids },
        ...(user.role === 'MEMBER' && { assigneeId: user.id }),
      },
      data: { status },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'STATUS_CHANGED',
      entityType: 'TASK',
      metadata: { count: ids.length, status, ids },
    });

    return result;
  }

  async bulkAssign(ids: string[], assigneeIds: string[], user: CurrentUserData) {
    const assigneeId = assigneeIds[0] || null;

    if (user.role === 'MEMBER' && assigneeId !== user.id) {
      throw new ForbiddenException('As a member, you can only assign tasks to yourself.');
    }

    const result = await this.prisma.task.updateMany({
      where: {
        id: { in: ids },
        ...(user.role === 'MEMBER' && { assigneeId: user.id }),
      },
      data: { assigneeId },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      metadata: { count: ids.length, assigneeId, ids },
    });

    return result;
  }

  async addDependency(taskId: string, dependsOnId: string, user: CurrentUserData) {
    const result = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        blockedBy: {
          connect: { id: dependsOnId },
        },
      },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      metadata: { addedDependency: dependsOnId },
    });

    return result;
  }

  async removeDependency(taskId: string, dependsOnId: string, user: CurrentUserData) {
    const result = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        blockedBy: {
          disconnect: { id: dependsOnId },
        },
      },
    });

    await this.activityService.log({
      userId: user.id,
      action: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      metadata: { removedDependency: dependsOnId },
    });

    return result;
  }

  async findAllGroupedByStatus(user: CurrentUserData): Promise<Record<string, any[]>> {
    const where: Record<string, any> = { isActive: true };

    if (user.role === 'MEMBER') {
      where.assigneeId = user.id;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        tags: true,
      },
      orderBy: [{ boardOrder: 'asc' }, { createdAt: 'desc' }],
    });

    // Group by status
    const grouped: Record<string, any[]> = {};
    for (const status of Object.values(TaskStatus)) {
      grouped[status] = tasks.filter((t) => t.status === status);
    }
    return grouped;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: CurrentUserData) {
    const task = await this.findOne(id);

    if (user.role === 'MEMBER' && task.assigneeId !== user.id) {
      throw new ForbiddenException(
        'You can only update tasks assigned to you',
      );
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.boardOrder !== undefined && { boardOrder: dto.boardOrder }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            department: true,
          },
        },
        tags: true,
      },
    });

    // Notify assignee about status/board change
    if (updatedTask.assigneeId && updatedTask.assigneeId !== user.id && task.status !== dto.status) {
      this.notificationsService.dispatch({
        recipientId: updatedTask.assigneeId,
        actorId: user.id,
        type: 'task_updated',
        entityType: 'task',
        entityId: updatedTask.id,
        payload: {
          taskTitle: updatedTask.title,
          changeDescription: `status changed to ${dto.status.replace('_', ' ')}`,
        },
      });
    }

    return updatedTask;
  }
}
