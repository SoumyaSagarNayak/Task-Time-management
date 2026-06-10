import type { 
  Task, 
  TaskStatus, 
  TaskPriority, 
  TimeEntry, 
  TimeSummary, 
  Comment, 
  Notification, 
  Tag, 
  ActivityLog, 
  ActivityAction 
} from './types';

// Storage Key
const DB_KEY = 'flowpilot_db';

export interface DbSchema {
  users: Array<{
    id: string;
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    department?: string;
    isActive: boolean;
    role: 'ADMIN' | 'MEMBER';
    createdAt: string;
    updatedAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    boardOrder: number;
    estimatedHours?: number;
    dueDate?: string;
    assigneeId?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    blockedByIds: string[];
    blocksIds: string[];
    tagIds: string[];
  }>;
  comments: Array<{
    id: string;
    body: string;
    taskId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  timeEntries: Array<{
    id: string;
    userId: string;
    startTime: string;
    endTime: string;
    hours: number;
    description?: string;
    isBillable: boolean;
    createdAt: string;
    updatedAt: string;
    taskIds: string[];
  }>;
  notifications: Array<{
    id: string;
    recipientId: string;
    actorId?: string | null;
    type: string;
    entityType: string;
    entityId: string;
    payload: any;
    isRead: boolean;
    readAt?: string | null;
    createdAt: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    color: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  activityLogs: Array<{
    id: string;
    userId: string;
    action: ActivityAction;
    entityType: string;
    entityId?: string;
    metadata?: any;
    createdAt: string;
  }>;
}

// Helper: safe JSON parsing
function safeParse(str: string | null): any {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// Get raw DB state
export function getDb(): DbSchema {
  if (typeof window === 'undefined') {
    return { users: [], tasks: [], comments: [], timeEntries: [], notifications: [], tags: [], activityLogs: [] };
  }
  let db = safeParse(localStorage.getItem(DB_KEY));
  if (!db) {
    db = initMockDb();
  }
  return db;
}

// Save DB state
export function saveDb(db: DbSchema) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
}

// Decode Clerk Token to get Clerk User ID (sub)
export function decodeClerkToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const jwt = token.replace('Bearer ', '');
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(window.atob(parts[1]));
    return payload.sub || null;
  } catch (e) {
    return null;
  }
}

// Get current user from token
export function getCurrentUserFromToken(token: string | null) {
  const clerkId = decodeClerkToken(token);
  const db = getDb();
  if (clerkId) {
    const user = db.users.find(u => u.clerkId === clerkId);
    if (user) return user;
  }
  
  // Fallback to first user in database (for local dev when token isn't verified yet)
  if (db.users.length > 0) {
    return db.users[0];
  }
  
  // Ultimate backup
  return {
    id: 'default-user',
    clerkId: clerkId || 'default-clerk-id',
    email: 'user@example.com',
    firstName: 'Default',
    lastName: 'User',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Sync logged-in Clerk User to Local DB
export function syncClerkUser(clerkUser: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}) {
  const db = getDb();
  let user = db.users.find(u => u.clerkId === clerkUser.clerkId);
  
  if (user) {
    user.email = clerkUser.email;
    user.firstName = clerkUser.firstName || user.firstName;
    user.lastName = clerkUser.lastName || user.lastName;
    user.avatarUrl = clerkUser.avatarUrl || user.avatarUrl;
    user.updatedAt = new Date().toISOString();
  } else {
    // If this is the first real user, make them ADMIN, otherwise MEMBER
    const role = db.users.filter(u => !u.clerkId.startsWith('user_seed_')).length === 0 ? 'ADMIN' : 'MEMBER';
    
    user = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      clerkId: clerkUser.clerkId,
      email: clerkUser.email,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      avatarUrl: clerkUser.avatarUrl || '',
      role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(user);
    
    // Log activity
    db.activityLogs.push({
      id: `act_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      action: 'TASK_CREATED' as any, // Sync user activity log
      entityType: 'USER',
      entityId: user.id,
      createdAt: new Date().toISOString(),
    });
  }
  
  saveDb(db);
  return user;
}

// Log an audit trail activity
export function logActivity(userId: string, action: ActivityAction, entityType: string, entityId?: string, metadata?: any) {
  const db = getDb();
  db.activityLogs.push({
    id: `act_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  });
  saveDb(db);
}

// Seeding Default DB
function initMockDb(): DbSchema {
  const now = new Date();
  
  const seedUsers = [
    { id: 'usr_alice', clerkId: 'user_seed_alice', email: 'alice@webyalaya.com', firstName: 'Alice', lastName: 'Smith', role: 'MEMBER' as const, isActive: true, department: 'Engineering', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'usr_bob', clerkId: 'user_seed_bob', email: 'bob@webyalaya.com', firstName: 'Bob', lastName: 'Jones', role: 'ADMIN' as const, isActive: true, department: 'Product', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'usr_charlie', clerkId: 'user_seed_charlie', email: 'charlie@webyalaya.com', firstName: 'Charlie', lastName: 'Brown', role: 'MEMBER' as const, isActive: true, department: 'Design', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'usr_diana', clerkId: 'user_seed_diana', email: 'diana@webyalaya.com', firstName: 'Diana', lastName: 'Prince', role: 'MEMBER' as const, isActive: true, department: 'Marketing', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'usr_evan', clerkId: 'user_seed_evan', email: 'evan@webyalaya.com', firstName: 'Evan', lastName: 'Wright', role: 'MEMBER' as const, isActive: true, department: 'Engineering', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'usr_fiona', clerkId: 'user_seed_fiona', email: 'fiona@webyalaya.com', firstName: 'Fiona', lastName: 'Gallagher', role: 'MEMBER' as const, isActive: true, department: 'Support', createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ];

  const seedTags = [
    { id: 'tag_frontend', name: 'Frontend', color: '#3B82F6', isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'tag_backend', name: 'Backend', color: '#10B981', isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'tag_bug', name: 'Bug', color: '#EF4444', isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'tag_feature', name: 'Feature', color: '#8B5CF6', isActive: true, createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ];

  const taskNames = [
    { title: 'Design System Refactor', priority: 'HIGH', status: 'IN_PROGRESS', est: 8, tagIds: ['tag_frontend'] },
    { title: 'API Architecture Review', priority: 'MEDIUM', status: 'IN_REVIEW', est: 4, tagIds: ['tag_backend'] },
    { title: 'Sprint Planning', priority: 'LOW', status: 'DONE', est: 2, tagIds: [] },
    { title: 'Homepage Redesign', priority: 'MEDIUM', status: 'TODO', est: 12, tagIds: ['tag_frontend'] },
    { title: 'Database Migration', priority: 'URGENT', status: 'IN_PROGRESS', est: 6, tagIds: ['tag_backend'] },
    { title: 'User Research', priority: 'LOW', status: 'DONE', est: 5, tagIds: [] },
    { title: 'Implement Auth Flow', priority: 'HIGH', status: 'IN_PROGRESS', est: 10, tagIds: ['tag_backend'] },
    { title: 'Fix Login Bugs', priority: 'URGENT', status: 'TODO', est: 3, tagIds: ['tag_bug', 'tag_frontend'] },
    { title: 'Update Documentation', priority: 'LOW', status: 'DONE', est: 3, tagIds: [] },
    { title: 'Client Meeting', priority: 'LOW', status: 'DONE', est: 1, tagIds: [] },
    { title: 'Weekly Sync', priority: 'LOW', status: 'DONE', est: 1, tagIds: [] },
    { title: 'Code Review Pipeline', priority: 'MEDIUM', status: 'IN_PROGRESS', est: 4, tagIds: ['tag_backend'] },
    { title: 'Payment Gateway Integration', priority: 'HIGH', status: 'TODO', est: 16, tagIds: ['tag_backend', 'tag_feature'] },
    { title: 'Marketing Landing Page', priority: 'MEDIUM', status: 'TODO', est: 8, tagIds: ['tag_frontend', 'tag_feature'] },
    { title: 'Optimize Images', priority: 'LOW', status: 'TODO', est: 3, tagIds: ['tag_frontend'] },
    { title: 'Setup CI/CD', priority: 'HIGH', status: 'TODO', est: 5, tagIds: ['tag_backend'] },
    { title: 'SEO Improvements', priority: 'MEDIUM', status: 'TODO', est: 6, tagIds: ['tag_frontend'] },
    { title: 'Accessibility Audit', priority: 'HIGH', status: 'TODO', est: 8, tagIds: ['tag_frontend'] }
  ];

  const seedTasks = taskNames.map((t, idx) => ({
    id: `tsk_${idx + 1}`,
    title: t.title,
    description: `Detailed description for ${t.title}. This represents work done inside Flow Pilot.`,
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
    boardOrder: idx * 1000,
    estimatedHours: t.est,
    dueDate: new Date(now.getTime() + (idx - 5) * 24 * 60 * 60 * 1000).toISOString(),
    assigneeId: seedUsers[idx % seedUsers.length].id,
    isActive: true,
    createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    blockedByIds: [] as string[],
    blocksIds: [] as string[],
    tagIds: t.tagIds,
  }));

  // Build task dependencies
  seedTasks[0].blockedByIds = [seedTasks[3].id];
  seedTasks[3].blocksIds = [seedTasks[0].id];

  // Time Entries: log entries for last 10 days
  const seedTimeEntries: DbSchema['timeEntries'] = [];
  const seedActivityLogs: DbSchema['activityLogs'] = [];

  let entryIdCounter = 1;
  let logIdCounter = 1;

  for (let d = -10; d <= 0; d++) {
    const currentDate = new Date(now);
    currentDate.setDate(now.getDate() + d);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends mainly

    for (const user of seedUsers) {
      // 1-2 entries per day per user
      const entriesCount = Math.floor(Math.random() * 2) + 1;
      let hoursLoggedToday = 0;

      for (let i = 0; i < entriesCount; i++) {
        if (hoursLoggedToday >= 8) break;
        
        const taskIdx = Math.floor(Math.random() * seedTasks.length);
        const task = seedTasks[taskIdx];
        const hours = Math.round((Math.random() * 2 + 1) * 2) / 2; // 1.0 to 3.0

        const startHour = 9 + hoursLoggedToday;
        const startTime = new Date(currentDate);
        startTime.setHours(startHour, 0, 0, 0);

        const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
        hoursLoggedToday += hours;

        const entryId = `ent_${entryIdCounter++}`;
        const isBillable = Math.random() > 0.3; // 70% billable

        seedTimeEntries.push({
          id: entryId,
          userId: user.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          hours,
          description: `Worked on ${task.title} task`,
          isBillable,
          createdAt: startTime.toISOString(),
          updatedAt: startTime.toISOString(),
          taskIds: [task.id]
        });

        // Add some activity logs
        seedActivityLogs.push({
          id: `act_${logIdCounter++}`,
          userId: user.id,
          action: 'TIME_ENTRY_CREATED' as any,
          entityType: 'TIME_ENTRY',
          entityId: entryId,
          metadata: { hours },
          createdAt: startTime.toISOString()
        });
      }
    }
  }

  // Seed user logons
  seedUsers.forEach((user, i) => {
    seedActivityLogs.push({
      id: `act_${logIdCounter++}`,
      userId: user.id,
      action: 'USER_CREATED' as any,
      entityType: 'USER',
      entityId: user.id,
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  const seedComments = [
    { id: 'com_1', body: 'I will handle the styling on this refactor.', taskId: 'tsk_1', userId: 'usr_alice', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'com_2', body: 'Sounds good. Let me know if you need database support.', taskId: 'tsk_1', userId: 'usr_bob', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'com_3', body: 'Draft layout is done. Please review.', taskId: 'tsk_4', userId: 'usr_charlie', createdAt: now.toISOString(), updatedAt: now.toISOString() }
  ];

  const seedNotifications = [
    { id: 'ntf_1', recipientId: 'usr_alice', actorId: 'usr_bob', type: 'TASK_ASSIGNED', entityType: 'task', entityId: 'tsk_1', payload: { taskTitle: 'Design System Refactor' }, isRead: false, readAt: null, createdAt: now.toISOString() },
    { id: 'ntf_2', recipientId: 'usr_bob', actorId: 'usr_alice', type: 'COMMENT_ADDED', entityType: 'comment', entityId: 'com_1', payload: { taskTitle: 'Design System Refactor', commentBody: 'I will handle the styling...' }, isRead: false, readAt: null, createdAt: now.toISOString() }
  ];

  const db: DbSchema = {
    users: seedUsers,
    tasks: seedTasks,
    comments: seedComments,
    timeEntries: seedTimeEntries,
    notifications: seedNotifications,
    tags: seedTags,
    activityLogs: seedActivityLogs
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  return db;
}
