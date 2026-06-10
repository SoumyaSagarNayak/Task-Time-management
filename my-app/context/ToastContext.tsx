"use client";
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

import React, { createContext, useReducer, ReactNode, useMemo } from 'react';
import { Toast, ToastContextType, ToastOptions, ToastPosition } from '../components/ui/toast/Toast.types';
import { buildToast, enforceToastLimit, validateToastInput } from '../components/ui/toast/toastHelpers';

// Actions
export type ToastAction =
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' };

/**
 * Reducer function to manage the array of active toasts.
 */
const toastReducer = (state: Toast[], action: ToastAction): Toast[] => {
  switch (action.type) {
    case 'ADD_TOAST':
      // The new toast is added and the list is enforce limited
      return enforceToastLimit([...state, action.payload]);
    case 'REMOVE_TOAST':
      return state.filter((toast) => toast.id !== action.payload);
    case 'CLEAR_TOASTS':
      return [];
    default:
      return state;
  }
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, position = 'top-right' }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const contextValue = useMemo(() => {
    const addToast = (options: ToastOptions) => {
      // Validate input before adding
      if (!validateToastInput(options)) {
        return; // Early return for invalid input
      }

      const newToast = buildToast(options);
      dispatch({ type: 'ADD_TOAST', payload: newToast });
    };

    const removeToast = (id: string) => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    };

    const clearToasts = () => {
      dispatch({ type: 'CLEAR_TOASTS' });
    };

    return {
      toasts,
      addToast,
      removeToast,
      clearToasts,
      position,
    };
  }, [toasts, position]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};
