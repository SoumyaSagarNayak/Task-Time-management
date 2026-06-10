import axios, { AxiosInstance } from 'axios';
import { Task, CreateTaskDto, Employee } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type TokenGetter = () => Promise<string | null>;

let apiTokenGetter: TokenGetter | null = null;

export const setApiTokenGetter = (getter: TokenGetter | null) => {
  apiTokenGetter = getter;
};

// Base axios instance (no automatic auth — each caller passes its own token)
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
  // Inject token if available and not already provided
  if (apiTokenGetter && !config.headers.Authorization) {
    try {
      const token = await apiTokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to get auth token', e);
    }
  }
  
  return config;
});

// Global error interceptor — toast on API errors (skip 401 which Clerk handles)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status && status !== 401) {
      const message =
        error.response?.data?.message || error.message || 'An unexpected error occurred';

      // Dynamic import to avoid circular deps and SSR issues
      if (typeof window !== 'undefined') {
        import('@/hooks/use-toast').then(({ toast }) => {
          toast({
            variant: 'destructive',
            title: `Error ${status}`,
            description: Array.isArray(message) ? message.join(', ') : message,
          });
        });
      }
    }
    return Promise.reject(error);
  }
);

// Comments API
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

// Employees API
export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await api.get('/employees');
  return response.data;
};

// Tasks API
export const createTask = async (data: CreateTaskDto): Promise<Task> => {
  const response = await api.post('/tasks', data);
  return response.data;
};

// Time Entries API
export const createTimeEntry = async (data: any) => {
  const response = await api.post('/time-entries', data);
  return response.data;
};

export const fetchTaskTimeEntries = async (taskId: string) => {
  const response = await api.get(`/time-entries?taskId=${taskId}`);
  return response.data;
};

// Notifications API
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

// Profile API
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
