import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { TasksService } from './tasks.service';

const createAdmin = () => ({
  id: 'admin_1',
  role: 'ADMIN',
});

const createMember = () => ({
  id: 'member_1',
  role: 'MEMBER',
});

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;
  let notificationsService: any;
  let activityService: any;

  beforeEach(() => {
    prisma = {
      task: {
        create: jest.fn().mockImplementation(() => ({
          then: jest.fn().mockImplementation((cb) => Promise.resolve({ id: 'task_1', title: 'Test Task', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM }).then(cb))
        })),
        update: jest.fn().mockImplementation(() => ({
          then: jest.fn().mockImplementation((cb) => Promise.resolve({ id: 'task_1', status: TaskStatus.DONE }).then(cb))
        })),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((promises) => Promise.all(promises)),
    };
    notificationsService = { dispatch: jest.fn() };
    activityService = { log: jest.fn() };
    service = new TasksService(prisma, notificationsService, activityService);

    // Default mock for findUnique to avoid unexpected failures
    prisma.task.findUnique.mockResolvedValue({ id: 'some_id', isActive: true });
  });

  describe('create', () => {
    it('creates a task (Admin)', async () => {
      const user = createAdmin();
      prisma.task.create.mockImplementation(() => Promise.resolve({
        id: 'task_1',
        title: 'Test Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
      }));

      const result = await service.create({
        title: 'Test Task',
      }, user as any);

      expect(result.id).toBe('task_1');
    });

    it('validates assigned user exists and is active', async () => {
      const user = createAdmin();
      prisma.user.findUnique.mockResolvedValue({ id: 'user_1', isActive: true });
      prisma.task.create.mockImplementation(() => Promise.resolve({ id: 'task_1' }));

      await service.create({
        title: 'Valid Assignment',
        assigneeId: 'user_1',
      }, user as any);

      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('updates task status', async () => {
      const user = createAdmin();
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'task_1',
        title: 'Test Task',
        status: TaskStatus.TODO,
      } as any);
      prisma.task.update.mockImplementation(() => Promise.resolve({ id: 'task_1', status: TaskStatus.DONE }));

      await service.updateStatus('task_1', { status: TaskStatus.DONE }, user as any);

      expect(prisma.task.update).toHaveBeenCalled();
    });
  });

  describe('bulk operations', () => {
    it('bulk removes tasks', async () => {
      const user = createAdmin();
      const ids = ['t1', 't2'];
      prisma.task.findMany.mockResolvedValue([
        { id: 't1', title: 'T1', isActive: true },
        { id: 't2', title: 'T2', isActive: true },
      ]);
      prisma.task.updateMany.mockResolvedValue({ count: 2 });

      await service.bulkRemove(ids, user as any);

      expect(prisma.task.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        data: { isActive: false },
      });
      expect(activityService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TASK_DELETED' })
      );
    });
  });

  describe('dependencies', () => {
    it('successfully adds dependency', async () => {
      const user = createAdmin();
      prisma.task.findUnique
        .mockResolvedValueOnce({ id: 't1', isActive: true }) // task
        .mockResolvedValueOnce({ id: 't2', isActive: true }); // dependsOn

      prisma.task.update.mockImplementation(() => Promise.resolve({ id: 't1' }));

      await service.addDependency('t1', 't2', user as any);

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 't1' },
          data: { blockedBy: { connect: { id: 't2' } } }
        })
      );
    });
  });
});
