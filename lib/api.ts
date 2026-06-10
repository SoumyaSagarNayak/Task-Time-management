import { 
  getDb, 
  saveDb, 
  getCurrentUserFromToken, 
  syncClerkUser, 
  logActivity 
} from './mock-db';
import type { Task, CreateTaskDto, Employee, TaskStatus, TaskPriority, TimeEntry, TimeSummary } from './types';

type TokenGetter = () => Promise<string | null>;
let apiTokenGetter: TokenGetter | null = null;

export const setApiTokenGetter = (getter: TokenGetter | null) => {
  apiTokenGetter = getter;
};

// Helper to extract query parameters
function parseQueryParams(urlStr: string): Record<string, string> {
  try {
    const search = urlStr.includes('?') ? urlStr.split('?')[1] : urlStr;
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  } catch (e) {
    return {};
  }
}

// Simple bucket keys helper matching NestJS
function getBucketKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  if (groupBy === 'day') {
    return d.toISOString().split('T')[0];
  } else if (groupBy === 'month') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } else {
    // ISO week approx
    const dt = new Date(d.getTime());
    dt.setDate(dt.getDate() + 4 - (dt.getDay() || 7));
    const yearStart = new Date(Date.UTC(dt.getFullYear(), 0, 1));
    const weekNo = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${dt.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
}

// Custom Mock Client
const mockRequest = async (method: string, url: string, data?: any, config?: any) => {
  // Simulate network latency (50-150ms)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

  // Retrieve token
  let token: string | null = null;
  if (apiTokenGetter) {
    token = await apiTokenGetter();
  } else if (config?.headers?.Authorization) {
    token = config.headers.Authorization;
  }

  const db = getDb();
  const currentUser = getCurrentUserFromToken(token);
  const path = url.split('?')[0];
  const query = parseQueryParams(url);

  // Match routes
  try {
    // --- AUTH & USER PROFILE ---
    if (path === '/auth/ensure-user' && method === 'POST') {
      return { data: currentUser };
    }

    if (path === '/users/me' && method === 'GET') {
      return { data: currentUser };
    }

    if (path === '/users/me/profile' && method === 'PATCH') {
      const { firstName, lastName, email } = data || {};
      const user = db.users.find(u => u.id === currentUser.id);
      if (user) {
        user.firstName = firstName ?? user.firstName;
        user.lastName = lastName ?? user.lastName;
        user.email = email ?? user.email;
        user.updatedAt = new Date().toISOString();
        saveDb(db);
        logActivity(currentUser.id, 'USER_UPDATED' as any, 'USER', currentUser.id, { firstName, lastName });
        return { data: user };
      }
      throw new Error('User not found');
    }

    if (path === '/users' && method === 'GET') {
      return { data: db.users };
    }

    // --- EMPLOYEES ---
    if (path === '/employees' && method === 'GET') {
      const employees: Employee[] = db.users.map(u => ({
        id: u.id,
        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        initials: `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase() || '?',
        email: u.email,
        avatarUrl: u.avatarUrl,
        department: u.department,
      }));
      return { data: employees };
    }

    // --- TASKS ---
    if (path === '/tasks' && method === 'GET') {
      const search = query.search || '';
      const limit = query.limit ? parseInt(query.limit) : 1000;
      
      let filtered = db.tasks.filter(t => t.isActive);
      if (search) {
        const sLower = search.toLowerCase();
        filtered = filtered.filter(t => 
          t.title.toLowerCase().includes(sLower) || 
          (t.description || '').toLowerCase().includes(sLower)
        );
      }

      // Map references
      const mappedTasks = filtered.slice(0, limit).map(task => ({
        ...task,
        assignee: db.users.find(u => u.id === task.assigneeId),
        tags: db.tags.filter(t => task.tagIds.includes(t.id)),
        blockedBy: db.tasks.filter(t => task.blockedByIds.includes(t.id)),
        blocks: db.tasks.filter(t => task.blocksIds.includes(t.id)),
      }));

      return { data: mappedTasks };
    }

    // Fetch individual task details
    const taskMatch = path.match(/^\/tasks\/([^\/]+)(?:\/status)?$/);
    if (taskMatch && method === 'GET') {
      const taskId = taskMatch[1];
      const task = db.tasks.find(t => t.id === taskId && t.isActive);
      if (!task) throw new Error('Task not found');

      // Populate everything
      const mapped = {
        ...task,
        assignee: db.users.find(u => u.id === task.assigneeId),
        tags: db.tags.filter(t => task.tagIds.includes(t.id)),
        blockedBy: db.tasks.filter(t => task.blockedByIds.includes(t.id)),
        blocks: db.tasks.filter(t => task.blocksIds.includes(t.id)),
        timeEntries: db.timeEntries
          .filter(e => e.taskIds.includes(taskId))
          .map(e => ({
            ...e,
            user: db.users.find(u => u.id === e.userId)
          }))
      };
      return { data: mapped };
    }

    if (path === '/tasks' && method === 'POST') {
      const dto: CreateTaskDto = data;
      const newTaskId = `tsk_${Math.random().toString(36).substr(2, 9)}`;
      const newTask = {
        id: newTaskId,
        title: dto.title,
        description: dto.description || '',
        status: dto.status || ('TODO' as TaskStatus),
        priority: dto.priority || ('MEDIUM' as TaskPriority),
        boardOrder: db.tasks.length * 1000,
        estimatedHours: dto.estimatedHours,
        dueDate: dto.dueDate,
        assigneeId: dto.assigneeId || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blockedByIds: dto.blockedByIds || [],
        blocksIds: [] as string[],
        tagIds: dto.tagIds || [],
      };

      // Set dependency linkages
      if (newTask.blockedByIds.length > 0) {
        for (const blockedId of newTask.blockedByIds) {
          const depTask = db.tasks.find(t => t.id === blockedId);
          if (depTask && !depTask.blocksIds.includes(newTaskId)) {
            depTask.blocksIds.push(newTaskId);
          }
        }
      }

      db.tasks.push(newTask);
      saveDb(db);
      logActivity(currentUser.id, 'TASK_CREATED' as any, 'TASK', newTaskId, { title: dto.title });
      
      // If assigned to someone other than creator, trigger notification
      if (dto.assigneeId && dto.assigneeId !== currentUser.id) {
        db.notifications.push({
          id: `ntf_${Math.random().toString(36).substr(2, 9)}`,
          recipientId: dto.assigneeId,
          actorId: currentUser.id,
          type: 'TASK_ASSIGNED',
          entityType: 'task',
          entityId: newTaskId,
          payload: { taskTitle: dto.title },
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString()
        });
        saveDb(db);
      }

      return { data: newTask };
    }

    if (taskMatch && method === 'PATCH') {
      const taskId = taskMatch[1];
      const task = db.tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const oldStatus = task.status;
      const oldAssignee = task.assigneeId;

      // Update fields
      task.title = data.title ?? task.title;
      task.description = data.description ?? task.description;
      task.status = data.status ?? task.status;
      task.priority = data.priority ?? task.priority;
      task.estimatedHours = data.estimatedHours !== undefined ? data.estimatedHours : task.estimatedHours;
      task.dueDate = data.dueDate !== undefined ? data.dueDate : task.dueDate;
      task.assigneeId = data.assigneeId !== undefined ? data.assigneeId : task.assigneeId;
      task.boardOrder = data.boardOrder !== undefined ? data.boardOrder : task.boardOrder;
      task.tagIds = data.tagIds ?? task.tagIds;
      task.updatedAt = new Date().toISOString();

      // Handle dependencies update
      if (data.blockedByIds !== undefined) {
        // Remove old dependencies
        for (const bid of task.blockedByIds) {
          const oldDep = db.tasks.find(t => t.id === bid);
          if (oldDep) {
            oldDep.blocksIds = oldDep.blocksIds.filter(id => id !== taskId);
          }
        }
        // Link new
        task.blockedByIds = data.blockedByIds;
        for (const bid of task.blockedByIds) {
          const newDep = db.tasks.find(t => t.id === bid);
          if (newDep && !newDep.blocksIds.includes(taskId)) {
            newDep.blocksIds.push(taskId);
          }
        }
      }

      saveDb(db);

      // Log status changes or general edits
      if (oldStatus !== task.status) {
        logActivity(currentUser.id, 'TASK_STATUS_CHANGED' as any, 'TASK', taskId, { status: task.status, oldStatus });
      } else {
        logActivity(currentUser.id, 'TASK_UPDATED' as any, 'TASK', taskId, { title: task.title });
      }

      // Assignee notification
      if (task.assigneeId && task.assigneeId !== oldAssignee && task.assigneeId !== currentUser.id) {
        db.notifications.push({
          id: `ntf_${Math.random().toString(36).substr(2, 9)}`,
          recipientId: task.assigneeId,
          actorId: currentUser.id,
          type: 'TASK_ASSIGNED',
          entityType: 'task',
          entityId: taskId,
          payload: { taskTitle: task.title },
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString()
        });
        saveDb(db);
      }

      return { data: task };
    }

    if (taskMatch && method === 'DELETE') {
      const taskId = taskMatch[1];
      const task = db.tasks.find(t => t.id === taskId);
      if (task) {
        task.isActive = false;
        
        // Remove dependency connections
        for (const bid of task.blockedByIds) {
          const dep = db.tasks.find(t => t.id === bid);
          if (dep) dep.blocksIds = dep.blocksIds.filter(id => id !== taskId);
        }
        for (const bid of task.blocksIds) {
          const dep = db.tasks.find(t => t.id === bid);
          if (dep) dep.blockedByIds = dep.blockedByIds.filter(id => id !== taskId);
        }

        saveDb(db);
        logActivity(currentUser.id, 'TASK_DELETED' as any, 'TASK', taskId, { title: task.title });
      }
      return { data: { success: true } };
    }

    // Dependencies
    const depMatch = path.match(/^\/tasks\/([^\/]+)\/dependencies\/([^\/]+)$/);
    if (depMatch) {
      const taskId = depMatch[1];
      const dependsOnId = depMatch[2];
      const task = db.tasks.find(t => t.id === taskId);
      const dependency = db.tasks.find(t => t.id === dependsOnId);

      if (!task || !dependency) throw new Error('Tasks not found');

      if (method === 'POST') {
        if (!task.blockedByIds.includes(dependsOnId)) {
          task.blockedByIds.push(dependsOnId);
        }
        if (!dependency.blocksIds.includes(taskId)) {
          dependency.blocksIds.push(taskId);
        }
        saveDb(db);
        return { data: task };
      }

      if (method === 'DELETE') {
        task.blockedByIds = task.blockedByIds.filter(id => id !== dependsOnId);
        dependency.blocksIds = dependency.blocksIds.filter(id => id !== taskId);
        saveDb(db);
        return { data: task };
      }
    }

    // --- COMMENTS ---
    const commentsMatch = path.match(/^\/tasks\/([^\/]+)\/comments$/);
    if (commentsMatch && method === 'GET') {
      const taskId = commentsMatch[1];
      const taskComments = db.comments
        .filter(c => c.taskId === taskId)
        .map(c => {
          const user = db.users.find(u => u.id === c.userId) || currentUser;
          return {
            id: c.id,
            body: c.body,
            createdAt: c.createdAt,
            author: {
              id: user.id,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              email: user.email
            }
          };
        });
      return { data: taskComments };
    }

    if (commentsMatch && method === 'POST') {
      const taskId = commentsMatch[1];
      const { body } = data;
      const newCommentId = `com_${Math.random().toString(36).substr(2, 9)}`;
      const newComment = {
        id: newCommentId,
        body,
        taskId,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.comments.push(newComment);
      saveDb(db);
      logActivity(currentUser.id, 'COMMENT_ADDED' as any, 'COMMENT', newCommentId, { taskId });

      // Notify task assignee if someone else comments
      const task = db.tasks.find(t => t.id === taskId);
      if (task && task.assigneeId && task.assigneeId !== currentUser.id) {
        db.notifications.push({
          id: `ntf_${Math.random().toString(36).substr(2, 9)}`,
          recipientId: task.assigneeId,
          actorId: currentUser.id,
          type: 'COMMENT_ADDED',
          entityType: 'comment',
          entityId: newCommentId,
          payload: { taskTitle: task.title, commentBody: body.substring(0, 50) },
          isRead: false,
          readAt: null,
          createdAt: new Date().toISOString()
        });
        saveDb(db);
      }

      const user = db.users.find(u => u.id === currentUser.id) || currentUser;
      return {
        data: {
          id: newCommentId,
          body,
          createdAt: newComment.createdAt,
          author: {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email
          }
        }
      };
    }

    const commentMatch = path.match(/^\/comments\/([^\/]+)$/);
    if (commentMatch && method === 'DELETE') {
      const commentId = commentMatch[1];
      db.comments = db.comments.filter(c => c.id !== commentId);
      saveDb(db);
      logActivity(currentUser.id, 'COMMENT_DELETED' as any, 'COMMENT', commentId);
      return { data: { success: true } };
    }

    // --- TIME ENTRIES ---
    if (path === '/time-entries' && method === 'GET') {
      const { taskId, userId, startDate, endDate, page = '1', limit = '10' } = query;
      let filtered = [...db.timeEntries];

      if (currentUser.role === 'MEMBER') {
        filtered = filtered.filter(e => e.userId === currentUser.id);
      } else if (userId) {
        filtered = filtered.filter(e => e.userId === userId);
      }

      if (taskId) {
        filtered = filtered.filter(e => e.taskIds.includes(taskId));
      }

      if (startDate) {
        const start = new Date(startDate).getTime();
        filtered = filtered.filter(e => new Date(e.startTime).getTime() >= start);
      }

      if (endDate) {
        const end = new Date(endDate).getTime();
        filtered = filtered.filter(e => new Date(e.endTime).getTime() <= end);
      }

      // Sort by start time descending
      filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      const slice = filtered.slice(startIdx, endIdx);

      const mappedSlice = slice.map(entry => ({
        ...entry,
        user: db.users.find(u => u.id === entry.userId),
        tasks: db.tasks.filter(t => entry.taskIds.includes(t.id)).map(t => ({
          id: t.id,
          title: t.title,
          status: t.status
        }))
      }));

      return {
        data: {
          data: mappedSlice,
          total: filtered.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(filtered.length / limitNum) || 1,
        }
      };
    }

    if (path === '/time-entries' && method === 'POST') {
      const { startTime, endTime, hours, description, isBillable = false, taskIds = [] } = data;
      const newId = `ent_${Math.random().toString(36).substr(2, 9)}`;
      
      const newEntry = {
        id: newId,
        userId: currentUser.id,
        startTime,
        endTime,
        hours: hours ?? ((new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000),
        description,
        isBillable,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        taskIds,
      };

      db.timeEntries.push(newEntry);
      saveDb(db);
      logActivity(currentUser.id, 'TIME_ENTRY_CREATED' as any, 'TIME_ENTRY', newId, { hours: newEntry.hours });

      return { data: {
        ...newEntry,
        user: db.users.find(u => u.id === currentUser.id),
        tasks: db.tasks.filter(t => taskIds.includes(t.id))
      }};
    }

    const timeEntryMatch = path.match(/^\/time-entries\/([^\/]+)$/);
    if (timeEntryMatch && method === 'PATCH') {
      const entryId = timeEntryMatch[1];
      const entry = db.timeEntries.find(e => e.id === entryId);
      if (!entry) throw new Error('Time entry not found');

      entry.startTime = data.startTime ?? entry.startTime;
      entry.endTime = data.endTime ?? entry.endTime;
      entry.hours = data.hours ?? entry.hours;
      entry.description = data.description ?? entry.description;
      entry.isBillable = data.isBillable ?? entry.isBillable;
      entry.taskIds = data.taskIds ?? entry.taskIds;
      entry.updatedAt = new Date().toISOString();

      saveDb(db);
      return { data: entry };
    }

    if (timeEntryMatch && method === 'DELETE') {
      const entryId = timeEntryMatch[1];
      const entry = db.timeEntries.find(e => e.id === entryId);
      if (entry) {
        db.timeEntries = db.timeEntries.filter(e => e.id !== entryId);
        saveDb(db);
        logActivity(currentUser.id, 'TIME_ENTRY_DELETED' as any, 'TIME_ENTRY', entryId, { hours: entry.hours });
      }
      return { data: { success: true } };
    }

    if (path === '/time-entries/bulk-delete' && method === 'POST') {
      const { ids } = data;
      db.timeEntries = db.timeEntries.filter(e => !ids.includes(e.id));
      saveDb(db);
      logActivity(currentUser.id, 'TIME_ENTRY_BULK_DELETED' as any, 'TIME_ENTRY', undefined, { count: ids.length });
      return { data: { success: true } };
    }

    // --- TIME SUMMARIES FOR DASHBOARD ---
    if (path === '/time-entries/reports/summary' && method === 'GET') {
      const { startDate, endDate, userId, taskId } = query;
      let entries = [...db.timeEntries];

      if (currentUser.role === 'MEMBER') {
        entries = entries.filter(e => e.userId === currentUser.id);
      } else if (userId) {
        entries = entries.filter(e => e.userId === userId);
      }

      if (taskId) {
        entries = entries.filter(e => e.taskIds.includes(taskId));
      }

      if (startDate) {
        const start = new Date(startDate).getTime();
        entries = entries.filter(e => new Date(e.startTime).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        entries = entries.filter(e => new Date(e.endTime).getTime() <= end);
      }

      const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

      const byUserMap: Record<string, any> = {};
      const byTaskMap: Record<string, any> = {};

      entries.forEach(entry => {
        // User aggregation
        if (!byUserMap[entry.userId]) {
          const user = db.users.find(u => u.id === entry.userId) || currentUser;
          byUserMap[entry.userId] = {
            user: { id: user.id, firstName: user.firstName, lastName: user.lastName },
            totalHours: 0,
            entriesCount: 0
          };
        }
        byUserMap[entry.userId].totalHours += entry.hours;
        byUserMap[entry.userId].entriesCount += 1;

        // Task aggregation
        entry.taskIds.forEach(tId => {
          if (!byTaskMap[tId]) {
            const t = db.tasks.find(task => task.id === tId);
            byTaskMap[tId] = {
              task: { id: tId, title: t ? t.title : 'Deleted Task' },
              totalHours: 0,
              entriesCount: 0
            };
          }
          byTaskMap[tId].totalHours += entry.hours;
          byTaskMap[tId].entriesCount += 1;
        });
      });

      return {
        data: {
          summary: {
            totalHours,
            entriesCount: entries.length,
          },
          byUser: Object.values(byUserMap),
          byTask: Object.values(byTaskMap),
        }
      };
    }

    // --- GENERAL REPORTS ---
    if (path === '/reports/summary' && method === 'GET') {
      const { startDate, endDate } = query;
      const start = new Date(startDate);
      const end = new Date(endDate);

      const entries = db.timeEntries.filter(e => {
        const d = new Date(e.startTime).getTime();
        return d >= start.getTime() && d <= end.getTime();
      });

      let totalHours = 0;
      let billableHours = 0;
      const activeUserIds = new Set<string>();
      const activeTaskIds = new Set<string>();

      entries.forEach(entry => {
        totalHours += entry.hours;
        if (entry.isBillable) billableHours += entry.hours;
        activeUserIds.add(entry.userId);
        entry.taskIds.forEach(tid => activeTaskIds.add(tid));
      });

      const nonBillableHours = totalHours - billableHours;
      const billablePercentage = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
      const avgDailyHours = activeUserIds.size > 0 ? (totalHours / activeUserIds.size / days) : 0;

      return {
        data: {
          totalHours,
          billableHours,
          nonBillableHours,
          billablePercentage: Number(billablePercentage.toFixed(2)),
          activeUsers: activeUserIds.size,
          activeTasks: activeTaskIds.size,
          avgDailyHours: Number(avgDailyHours.toFixed(2)),
        }
      };
    }

    if (path === '/reports/time-by-task' && method === 'GET') {
      const { startDate, endDate } = query;
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      const entries = db.timeEntries.filter(e => {
        const t = new Date(e.startTime).getTime();
        return t >= start && t <= end;
      });

      const taskMap: Record<string, any> = {};
      entries.forEach(entry => {
        if (entry.taskIds.length === 0) return;
        const share = entry.hours / entry.taskIds.length;
        entry.taskIds.forEach(tid => {
          if (!taskMap[tid]) {
            const task = db.tasks.find(t => t.id === tid);
            taskMap[tid] = {
              taskId: tid,
              taskName: task ? task.title : 'Deleted Task',
              totalHours: 0,
              billable: entry.isBillable,
            };
          }
          taskMap[tid].totalHours += share;
        });
      });

      const list = Object.values(taskMap).sort((a: any, b: any) => b.totalHours - a.totalHours);
      return { data: list };
    }

    if (path === '/reports/user-productivity' && method === 'GET') {
      const { startDate, endDate, groupBy = 'day' } = query;
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      const entries = db.timeEntries.filter(e => {
        const t = new Date(e.startTime).getTime();
        return t >= start && t <= end;
      });

      const userMap: Record<string, { userId: string; userName: string; buckets: Record<string, number> }> = {};
      entries.forEach(entry => {
        if (!userMap[entry.userId]) {
          const u = db.users.find(usr => usr.id === entry.userId) || currentUser;
          userMap[entry.userId] = {
            userId: entry.userId,
            userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            buckets: {}
          };
        }
        const bucket = getBucketKey(new Date(entry.startTime), groupBy as any);
        userMap[entry.userId].buckets[bucket] = (userMap[entry.userId].buckets[bucket] || 0) + entry.hours;
      });

      const list = Object.values(userMap).map(u => ({
        userId: u.userId,
        userName: u.userName,
        buckets: Object.entries(u.buckets).map(([period, hours]) => ({ period, hours }))
      }));

      return { data: list };
    }

    if (path === '/reports/billable-vs-nonbillable' && method === 'GET') {
      const { startDate, endDate, groupBy = 'day' } = query;
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      const entries = db.timeEntries.filter(e => {
        const t = new Date(e.startTime).getTime();
        return t >= start && t <= end;
      });

      const bucketMap: Record<string, { billable: number; nonBillable: number }> = {};
      entries.forEach(entry => {
        const bucket = getBucketKey(new Date(entry.startTime), groupBy as any);
        if (!bucketMap[bucket]) {
          bucketMap[bucket] = { billable: 0, nonBillable: 0 };
        }
        if (entry.isBillable) {
          bucketMap[bucket].billable += entry.hours;
        } else {
          bucketMap[bucket].nonBillable += entry.hours;
        }
      });

      const list = Object.entries(bucketMap).map(([period, val]) => ({
        period,
        ...val
      }));

      return { data: list };
    }

    // --- NOTIFICATIONS ---
    if (path === '/notifications' && method === 'GET') {
      let userNtf = db.notifications.filter(n => n.recipientId === currentUser.id);
      userNtf.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const mapped = userNtf.map(n => ({
        ...n,
        actor: db.users.find(u => u.id === n.actorId)
      }));

      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 20;
      const startIdx = (page - 1) * limit;
      const items = mapped.slice(startIdx, startIdx + limit);

      return {
        data: {
          items,
          total: mapped.length,
          page,
          limit,
          totalPages: Math.ceil(mapped.length / limit) || 1,
          hasMore: startIdx + limit < mapped.length
        }
      };
    }

    if (path === '/notifications/unread/count' && method === 'GET') {
      const count = db.notifications.filter(n => n.recipientId === currentUser.id && !n.isRead).length;
      return { data: { count } };
    }

    const ntfReadMatch = path.match(/^\/notifications\/([^\/]+)\/read$/);
    if (ntfReadMatch && method === 'PATCH') {
      const ntfId = ntfReadMatch[1];
      const ntf = db.notifications.find(n => n.id === ntfId);
      if (ntf) {
        ntf.isRead = true;
        ntf.readAt = new Date().toISOString();
        saveDb(db);
      }
      return { data: { success: true } };
    }

    if (path === '/notifications/read-all' && method === 'PATCH') {
      db.notifications.forEach(n => {
        if (n.recipientId === currentUser.id && !n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        }
      });
      saveDb(db);
      return { data: { success: true } };
    }

    if (path === '/notifications/mark-read' && method === 'PATCH') {
      const ntfId = query.notificationId;
      if (ntfId) {
        const ntf = db.notifications.find(n => n.id === ntfId);
        if (ntf) {
          ntf.isRead = true;
          ntf.readAt = new Date().toISOString();
        }
      } else {
        db.notifications.forEach(n => {
          if (n.recipientId === currentUser.id && !n.isRead) {
            n.isRead = true;
            n.readAt = new Date().toISOString();
          }
        });
      }
      saveDb(db);
      return { data: { success: true } };
    }

    // --- ACTIVITY FEED ---
    if (path === '/activity' && method === 'GET') {
      let filtered = [...db.activityLogs];
      if (query.userId) {
        filtered = filtered.filter(l => l.userId === query.userId);
      }
      if (query.action) {
        filtered = filtered.filter(l => l.action === query.action);
      }

      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const page = query.page ? parseInt(query.page) : 1;
      const limit = query.limit ? parseInt(query.limit) : 20;
      const startIdx = (page - 1) * limit;

      const items = filtered.slice(startIdx, startIdx + limit).map(log => ({
        ...log,
        user: db.users.find(u => u.id === log.userId)
      }));

      return {
        data: {
          items,
          total: filtered.length,
          page,
          limit,
          totalPages: Math.ceil(filtered.length / limit) || 1
        }
      };
    }

    // --- SEARCH ---
    if (path === '/search' && method === 'GET') {
      const q = (query.q || '').toLowerCase().trim();
      const type = query.type || 'all'; // 'all' | 'task' | 'time_entry' | 'comment'
      const start = query.startDate ? new Date(query.startDate).getTime() : null;
      const end = query.endDate ? new Date(query.endDate).getTime() : null;
      
      const results: any[] = [];

      if (q.length >= 2) {
        // Search tasks
        if (type === 'all' || type === 'task') {
          db.tasks.forEach(t => {
            if (!t.isActive) return;
            const matchesTitle = t.title.toLowerCase().includes(q);
            const matchesDesc = (t.description || '').toLowerCase().includes(q);
            const dateVal = new Date(t.createdAt).getTime();

            if ((matchesTitle || matchesDesc) && 
                (!start || dateVal >= start) && 
                (!end || dateVal <= end)) {
              results.push({
                type: 'task',
                id: t.id,
                title: t.title,
                snippet: t.description ? t.description.substring(0, 100) : 'Task details',
                rank: matchesTitle ? 1 : 2,
                metadata: { taskId: t.id, taskTitle: t.title, createdAt: t.createdAt }
              });
            }
          });
        }

        // Search comments
        if (type === 'all' || type === 'comment') {
          db.comments.forEach(c => {
            const matchesBody = c.body.toLowerCase().includes(q);
            const dateVal = new Date(c.createdAt).getTime();

            if (matchesBody && 
                (!start || dateVal >= start) && 
                (!end || dateVal <= end)) {
              const task = db.tasks.find(t => t.id === c.taskId);
              results.push({
                type: 'comment',
                id: c.id,
                title: `Comment by ${db.users.find(u => u.id === c.userId)?.firstName || 'User'}`,
                snippet: c.body.substring(0, 100),
                rank: 3,
                metadata: { taskId: c.taskId, taskTitle: task ? task.title : 'Deleted Task', createdAt: c.createdAt }
              });
            }
          });
        }

        // Search time entries
        if (type === 'all' || type === 'time_entry') {
          db.timeEntries.forEach(e => {
            const matchesDesc = (e.description || '').toLowerCase().includes(q);
            const dateVal = new Date(e.startTime).getTime();

            if (matchesDesc && 
                (!start || dateVal >= start) && 
                (!end || dateVal <= end)) {
              const task = db.tasks.find(t => e.taskIds.includes(t.id));
              results.push({
                type: 'time_entry',
                id: e.id,
                title: task ? `Time log on ${task.title}` : 'General Work',
                snippet: e.description || 'Logged hours',
                rank: 4,
                metadata: { taskId: task?.id, taskTitle: task?.title, startTime: e.startTime }
              });
            }
          });
        }
      }

      results.sort((a, b) => a.rank - b.rank);
      return { data: { results: results.slice(0, 15) } };
    }

    // --- EXPORTS MOCK DOWNLOADS ---
    if (path.includes('/export')) {
      // Create a plain text formatted list matching CSV contents
      let exportText = '';
      if (path.includes('/time-entries/export') || path.includes('/time-entries/export/csv') || path.includes('/time-entries/export/pdf')) {
        let entries = [...db.timeEntries];
        if (query.startDate) {
          const s = new Date(query.startDate).getTime();
          entries = entries.filter(e => new Date(e.startTime).getTime() >= s);
        }
        if (query.endDate) {
          const e = new Date(query.endDate).getTime();
          entries = entries.filter(e => new Date(e.endTime).getTime() <= e);
        }

        exportText = 'Date,Start Time,End Time,Hours,Description,Billable,User,Tasks\n';
        entries.forEach(e => {
          const u = db.users.find(usr => usr.id === e.userId) || currentUser;
          const uName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
          const tasks = db.tasks.filter(t => e.taskIds.includes(t.id)).map(t => t.title).join('; ');
          exportText += `${e.startTime.split('T')[0]},${e.startTime},${e.endTime},${e.hours},"${(e.description || '').replace(/"/g, '""')}",${e.isBillable ? 'Yes' : 'No'},"${uName}","${tasks}"\n`;
        });
      } else if (path.includes('/activity/export')) {
        exportText = 'Date,User,Action,Entity,Metadata\n';
        db.activityLogs.forEach(l => {
          const u = db.users.find(usr => usr.id === l.userId) || currentUser;
          const uName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
          exportText += `${l.createdAt},"${uName}","${l.action}","${l.entityType}","${JSON.stringify(l.metadata || {})}"\n`;
        });
      }

      return {
        data: exportText
      };
    }

    throw new Error(`Endpoint mock not found: ${method} ${url}`);
  } catch (error: any) {
    console.error('Mock API Error:', error);
    return Promise.reject({
      message: error.message || 'An unexpected error occurred',
      response: {
        status: 400,
        data: { message: error.message || 'Mock processing error' }
      }
    });
  }
};

// Map mockRequest to AxiosInstance interface
export const api = {
  defaults: { headers: {} as any },
  interceptors: {
    request: { use: () => 0, eject: () => {} },
    response: { use: () => 0, eject: () => {} },
  },
  get: (url: string, config?: any) => mockRequest('GET', url, null, config),
  post: (url: string, data?: any, config?: any) => mockRequest('POST', url, data, config),
  put: (url: string, data?: any, config?: any) => mockRequest('PUT', url, data, config),
  patch: (url: string, data?: any, config?: any) => mockRequest('PATCH', url, data, config),
  delete: (url: string, config?: any) => mockRequest('DELETE', url, null, config),
} as any;

// Helper APIs conforming to lib/api.ts original exports
export const fetchComments = async (taskId: string) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const createComment = async (taskId: string, body: string) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { body });
  return response.data;
};

export const deleteComment = async (commentId: string) => {
  await api.delete(`/comments/${commentId}`);
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/employees');
  return response.data;
};

export const createTask = async (data: CreateTaskDto): Promise<Task> => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const createTimeEntry = async (data: any) => {
  const response = await api.post('/time-entries', data);
  return response.data;
};

export const fetchTaskTimeEntries = async (taskId: string) => {
  const response = await api.get(`/time-entries?taskId=${taskId}`);
  return response.data;
};

export const fetchNotifications = async (page = 1, limit = 20) => {
  const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread/count');
  return response.data;
};

export const markNotificationRead = async (notificationId?: string) => {
  const url = notificationId
    ? `/notifications/mark-read?notificationId=${notificationId}`
    : '/notifications/mark-read';
  await api.patch(url);
};

export const fetchCurrentUser = async (token: string | null) => {
  const response = await api.get('/users/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};

export const updateUserProfile = async (
  data: { firstName?: string; lastName?: string; email?: string },
  token: string | null
) => {
  const response = await api.patch('/users/me/profile', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
};
