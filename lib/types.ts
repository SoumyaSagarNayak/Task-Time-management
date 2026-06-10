// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  MEMBER = 'MEMBER',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CLOSED = 'CLOSED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Models
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  boardOrder: number;
  estimatedHours?: number;
  dueDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    avatarUrl?: string;
    department?: string;
  };
  tags?: Tag[];
  blockedBy?: Task[];
  blocks?: Task[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  tasks?: Array<{
    id: string;
    title: string;
    status: TaskStatus;
  }>;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  avatarUrl?: string;
  department?: string;
}

// DTOs
export interface CreateTaskDto {
  assigneeId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  dueDate?: string;
  tagIds?: string[];
  blockedByIds?: string[];
}

export interface CreateTimeEntryDto {
  userId?: string;
  taskIds?: string[];
  startTime: string;
  endTime: string;
  hours: number;
  description?: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface TimeSummary {
  summary: {
    totalHours: number;
    entriesCount: number;
  };
  byUser: Array<{
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
    totalHours: number;
    entriesCount: number;
  }>;
  byTask: Array<{
    task: {
      id: string;
      title: string;
    };
    totalHours: number;
    entriesCount: number;
  }>;
}
export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: CommentAuthor;
}

export enum ActivityAction {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_BULK_DELETED = 'TASK_BULK_DELETED',
  TASK_BULK_STATUS_CHANGED = 'TASK_BULK_STATUS_CHANGED',
  TASK_BULK_ASSIGNED = 'TASK_BULK_ASSIGNED',
  TIME_ENTRY_CREATED = 'TIME_ENTRY_CREATED',
  TIME_ENTRY_DELETED = 'TIME_ENTRY_DELETED',
  TIME_ENTRY_BULK_DELETED = 'TIME_ENTRY_BULK_DELETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_DELETED = 'COMMENT_DELETED',
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface ActivityFeedResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId?: string;
  type: string;
  entityType: string;
  entityId?: string;
  payload: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  actor?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

