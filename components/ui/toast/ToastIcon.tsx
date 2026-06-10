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
import { ToastType } from './Toast.types';
import { getToastIcon } from './toastHelpers';
import styles from './Toast.module.css';

interface ToastIconProps {
  type: ToastType;
}

export const ToastIcon: React.FC<ToastIconProps> = ({ type }) => {
  const IconComponent = getToastIcon(type);

  // You can customize icon colors directly here or use inherited colors
  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '#22c55e'; // green-500
      case 'error':
        return '#ef4444'; // red-500
      case 'warning':
        return '#f59e0b'; // amber-500
      case 'info':
      default:
        return '#3b82f6'; // blue-500
    }
  };

  return (
    <div className={styles.iconWrapper} style={{ color: getColor(type) }}>
      <IconComponent size={20} aria-hidden="true" />
    </div>
  );
};
