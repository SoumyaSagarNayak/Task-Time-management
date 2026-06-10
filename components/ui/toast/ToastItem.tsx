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

import React, { useEffect, useState, useRef } from 'react';
import { Toast, ToastPosition } from './Toast.types';
import { ToastIcon } from './ToastIcon';
import { getEnterAnimation, getExitAnimation } from './toastAnimations';
import { X } from 'lucide-react';
import styles from './Toast.module.css';

interface ToastItemProps {
  toast: Toast;
  position: ToastPosition;
  onRemove: (id: string) => void;
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, position, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(toast.duration || 0);

  const startTimer = () => {
    if (remainingTimeRef.current <= 0) return; // Disable auto-dismiss if duration <= 0
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingTimeRef.current);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseTimer = () => {
    clearTimer();
    if (remainingTimeRef.current > 0) {
      // Calculate how much time passed since start and subtract from remaining
      remainingTimeRef.current -= Date.now() - startTimeRef.current;
    }
  };

  const resumeTimer = () => {
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return () => clearTimer(); // Clear timer on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    // Remove toast after animation duration
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // 300ms matches the CSS animation duration
  };

  const enterClass = getEnterAnimation(position);
  const exitClass = getExitAnimation(position);
  const animationClass = isExiting ? exitClass : enterClass;

  return (
    <div
      className={`${styles.toastItem} ${animationClass}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <ToastIcon type={toast.type} />

      <div className={styles.message}>
        {toast.message}
      </div>

      <button
        onClick={handleClose}
        className={styles.closeButton}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
