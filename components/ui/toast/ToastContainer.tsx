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

import React from 'react';
import { useToast } from '../../../hooks/useToast';
import { ToastItem } from './ToastItem';
import styles from './Toast.module.css';

export const ToastContainer: React.FC = () => {
  // We use the useToast hook here. The context ensures type safety and defaults.
  // Wait, useToast hook will throw if not in provider, so this is safe.
  try {
    const { toasts, removeToast, position = 'top-right' } = useToast();

    if (!toasts || toasts.length === 0) return null;

    // Use a custom class mapping for the container based on position
    const positionClass = styles[position] || styles['top-right'];

    return (
      <div className={`${styles.toastContainer} ${positionClass}`}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            position={position}
            onRemove={removeToast}
          />
        ))}
      </div>
    );
  } catch (e) {
    // If the container is rendered outside a provider somehow, just return null.
    // However, the rule states to ensure safe context usage.
    return null;
  }
};
