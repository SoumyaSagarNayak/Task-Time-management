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

import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';
import { ToastOptions } from '../components/ui/toast/Toast.types';

export const useToast = () => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, clearToasts, toasts, position } = context;

  const showToast = (options: ToastOptions) => {
    addToast(options);
  };

  const success = (message: string, duration?: number) => {
    addToast({ type: 'success', message, duration });
  };

  const error = (message: string, duration?: number) => {
    addToast({ type: 'error', message, duration });
  };

  const warning = (message: string, duration?: number) => {
    addToast({ type: 'warning', message, duration });
  };

  const info = (message: string, duration?: number) => {
    addToast({ type: 'info', message, duration });
  };

  return {
    toasts,
    position,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  };
};
