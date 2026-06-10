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

import { Toast, ToastOptions, ToastType } from './Toast.types';
import { DEFAULT_TOAST_DURATION, MAX_TOAST_LIMIT } from './toastConstants';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Generates a unique string ID for a toast based on timestamp and randomness
 */
export const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Validates the options provided to create a toast.
 * Logs a warning to the console and returns false if invalid.
 */
export const validateToastInput = (options: Partial<ToastOptions>): boolean => {
  if (!options) {
    console.warn("[ToastSystem] Invalid toast input: options must be an object");
    return false;
  }
  
  if (!options.message || typeof options.message !== 'string' || options.message.trim() === '') {
    console.warn("[ToastSystem] Invalid toast input: message must be a non-empty string");
    return false;
  }

  const validTypes: ToastType[] = ['success', 'error', 'warning', 'info'];
  if (!options.type || !validTypes.includes(options.type)) {
    console.warn(`[ToastSystem] Invalid toast input: type must be one of ${validTypes.join(', ')}`);
    return false;
  }

  if (options.duration !== undefined && (typeof options.duration !== 'number' || options.duration < 0)) {
    console.warn("[ToastSystem] Invalid toast input: duration must be a positive number if provided");
    return false;
  }

  return true;
};

/**
 * Builds a complete Toast object from the provided options,
 * applying default values where necessary.
 */
export const buildToast = (options: ToastOptions): Toast => {
  return {
    id: generateToastId(),
    message: options.message.trim(),
    type: options.type,
    duration: options.duration ?? DEFAULT_TOAST_DURATION,
    createdAt: Date.now(),
  };
};

/**
 * Enforces the max stack limit by removing the oldest toasts if exceeded.
 */
export const enforceToastLimit = (toasts: Toast[]): Toast[] => {
  if (toasts.length <= MAX_TOAST_LIMIT) {
    return toasts;
  }
  // Remove the oldest ones (assuming the end of array is oldest or start, we'll slice keeping the latest MAX_TOAST_LIMIT)
  // Let's assume new toasts are appended to the start of the array, so oldest are at the end.
  // Actually it's up to the reducer to handle. Let's slice the latest ones.
  // Assuming 'toasts' has latest at the end (push), we want the slice of the last MAX_TOAST_LIMIT elements.
  // If latest at start (unshift), we slice the first MAX_TOAST_LIMIT.
  // We'll keep the last MAX_TOAST_LIMIT items, assuming push. To be flexible we can just take the last MAX items.
  return toasts.slice(-MAX_TOAST_LIMIT);
};

/**
 * Returns the appropriate Lucide icon component for the given toast type.
 */
export const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
    default:
      return Info;
  }
};

/**
 * Returns the appropriate CSS color class for the given toast type.
 * Note: Actual mapping depends on your CSS setup.
 */
export const getToastColorClass = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    case 'warning':
      return 'bg-amber-500 text-white';
    case 'info':
    default:
      return 'bg-blue-500 text-white';
  }
};
