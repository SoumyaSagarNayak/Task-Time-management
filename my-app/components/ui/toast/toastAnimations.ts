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

import { ToastPosition } from './Toast.types';
import styles from './Toast.module.css';

/**
 * Returns the CSS class for enter animation based on position
 */
export const getEnterAnimation = (position: ToastPosition = 'top-right') => {
  if (position.includes('right')) return styles.slideInRight;
  return styles.slideInLeft;
};

/**
 * Returns the CSS class for exit animation based on position
 */
export const getExitAnimation = (position: ToastPosition = 'top-right') => {
  if (position.includes('right')) return styles.slideOutRight;
  return styles.slideOutLeft;
};
