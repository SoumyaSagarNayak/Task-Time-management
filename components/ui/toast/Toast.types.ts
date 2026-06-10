/**
 * Toast Notification System
 * Global UI feedback system used across the application.
 *
 * Supports:
 * - success
 * - error
 * - warning
 * - info
 *
 * Features:
 * - stacking notifications
 * - auto dismiss
 * - manual close
 * - animations
 * - validation
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
  createdAt: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  position?: ToastPosition;
}
