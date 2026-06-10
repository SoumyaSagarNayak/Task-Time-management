import { BadRequestException } from '@nestjs/common';
import { validateTimeRange, calculateDurationInHours } from '../utils/timeCalculationHelper';

/**
 * Custom validation error to structure validation failures.
 */
export class TimeValidationError extends BadRequestException {
  constructor(message: string) {
    super({
      success: false,
      message,
    });
  }
}

/**
 * Formats time difference to minutes (useful as a helper if needed elsewhere)
 */
export function formatTimeToMinutes(startTime: string | Date, endTime: string | Date): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

/**
 * Calculates the exact time difference in milliseconds
 */
export function calculateTimeDifference(startTime: string | Date, endTime: string | Date): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return end.getTime() - start.getTime();
}

/**
 * Validates start and end time specifically for time entries, 
 * explicitly throws TimeValidationError in failure cases.
 * Returns the calculated duration in hours.
 */
export function validateStartEndTime(startTime: string | Date, endTime: string | Date): number {
  const validationResult = validateTimeRange(startTime, endTime);
  if (!validationResult.success) {
    throw new TimeValidationError(validationResult.message || 'Invalid time range');
  }

  // Calculate hours correctly (0 if equal, difference if end > start)
  return calculateDurationInHours(startTime, endTime);
}
