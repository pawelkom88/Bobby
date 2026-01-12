/**
 * Duration Calculator
 * Pure function for calculating conversation duration in seconds
 */

export interface DurationCalculationResult {
  durationSeconds: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Validates that timestamps are in correct order
 */
function validateTimestamps(startTime: Date, endTime: Date): void {
  if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
    throw new Error('Invalid start timestamp: must be a valid Date');
  }

  if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
    throw new Error('Invalid end timestamp: must be a valid Date');
  }

  if (endTime < startTime) {
    throw new Error('Invalid timestamps: end time cannot be before start time');
  }
}

/**
 * Calculates the duration between two timestamps in seconds
 * Truncates to whole seconds (ignores milliseconds)
 *
 * @param startTime - The start of the conversation
 * @param endTime - The end of the conversation
 * @returns Duration in seconds (whole number)
 * @throws Error if timestamps are invalid or in wrong order
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
  validateTimestamps(startTime, endTime);

  const durationMs = endTime.getTime() - startTime.getTime();
  return Math.floor(durationMs / 1000);
}

/**
 * Calculates the duration and returns detailed result
 *
 * @param startTime - The start of the conversation
 * @param endTime - The end of the conversation
 * @returns Object containing duration and timestamps
 * @throws Error if timestamps are invalid or in wrong order
 */
export function calculateDurationDetailed(
  startTime: Date,
  endTime: Date
): DurationCalculationResult {
  const durationSeconds = calculateDuration(startTime, endTime);

  return {
    durationSeconds,
    startTime,
    endTime,
  };
}

/**
 * Checks if a duration meets the minimum threshold for charging
 * Minimum threshold is 30 seconds (exclusive)
 *
 * @param durationSeconds - Duration in seconds
 * @returns true if duration > 30 seconds, false otherwise
 */
export function meetsMinimumDuration(durationSeconds: number): boolean {
  return durationSeconds > 30;
}
