import { TimeValidationError } from '../validation/timeEntryValidation';

/**
 * Calculates the duration in hours between a start time and an end time.
 * If start time equals end time, returns 0.
 * 
 * @param startTime The start time string or Date
 * @param endTime The end time string or Date
 * @returns Duration in hours, rounded to 2 decimal places if needed
 */
export function calculateDurationInHours(startTime: string | Date, endTime: string | Date): number {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start.getTime() === end.getTime()) {
    return 0; // Explicitly handle start == end case
  }

  const durationMs = end.getTime() - start.getTime();
  return durationMs / (1000 * 60 * 60);
}

/**
 * Validates the time range based on the project requirements.
 * 
 * @param startTime The start time
 * @param endTime The end time
 * @returns An object with validation success and message
 */
export function validateTimeRange(startTime: string | Date, endTime: string | Date): { success: boolean; message?: string } {
  if (!startTime || !endTime) {
    return { success: false, message: 'Start time and end time are required' };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check for invalid date formats
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { success: false, message: 'Invalid time format' };
  }

  if (end.getTime() < start.getTime()) {
    return { success: false, message: 'End time must be greater than start time' };
  }

  return { success: true };
}
