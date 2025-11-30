/**
 * Duration Calculator Tests
 * Tests for conversation duration calculation logic
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDuration,
  calculateDurationDetailed,
  meetsMinimumDuration,
} from '@/lib/duration-calculator';
import {
  createTimestampPair90Sec,
  createTimestampPair0Sec,
  createTimestampPair30Sec,
  createTimestampPair15Sec,
  createTimestampPair31Sec,
  createTimestampPairMidnight,
  createTimestampPairWithMilliseconds,
  createInvalidTimestampPairEndBeforeStart,
} from '../fixtures/timestamps';

describe('Duration Calculator', () => {
  describe('Basic Duration Calculation', () => {
    it('should_calculate_duration_in_seconds', () => {
      const { start, end, durationSeconds } = createTimestampPair90Sec();
      const result = calculateDuration(start, end);
      expect(result).toBe(durationSeconds);
      expect(result).toBe(90);
    });

    it('should_return_zero_for_same_timestamps', () => {
      const { start, end } = createTimestampPair0Sec();
      const result = calculateDuration(start, end);
      expect(result).toBe(0);
    });

    it('should_handle_millisecond_precision', () => {
      const { start, end, durationSeconds } = createTimestampPairWithMilliseconds();
      const result = calculateDuration(start, end);
      // Should truncate to whole seconds
      expect(result).toBe(durationSeconds);
      expect(result).toBe(45);
    });

    it('should_truncate_milliseconds_not_round', () => {
      const start = new Date('2024-01-01T10:00:00.000Z');
      const end = new Date('2024-01-01T10:00:45.999Z');
      const result = calculateDuration(start, end);
      // 45999ms = 45.999 seconds, should truncate to 45
      expect(result).toBe(45);
    });
  });

  describe('Edge Cases', () => {
    it('should_handle_duration_spanning_midnight', () => {
      const { start, end, durationSeconds } = createTimestampPairMidnight();
      const result = calculateDuration(start, end);
      expect(result).toBe(durationSeconds);
      expect(result).toBe(120);
    });

    it('should_reject_end_before_start', () => {
      const { start, end } = createInvalidTimestampPairEndBeforeStart();
      expect(() => calculateDuration(start, end)).toThrow(
        'Invalid timestamps: end time cannot be before start time'
      );
    });

    it('should_reject_invalid_start_timestamp', () => {
      const invalidDate = new Date('invalid');
      const validDate = new Date();
      expect(() => calculateDuration(invalidDate, validDate)).toThrow(
        'Invalid start timestamp'
      );
    });

    it('should_reject_invalid_end_timestamp', () => {
      const validDate = new Date();
      const invalidDate = new Date('invalid');
      expect(() => calculateDuration(validDate, invalidDate)).toThrow(
        'Invalid end timestamp'
      );
    });

    it('should_reject_non_date_start_timestamp', () => {
      expect(() =>
        calculateDuration('not a date' as any, new Date())
      ).toThrow('Invalid start timestamp');
    });

    it('should_reject_non_date_end_timestamp', () => {
      expect(() =>
        calculateDuration(new Date(), 'not a date' as any)
      ).toThrow('Invalid end timestamp');
    });
  });

  describe('Detailed Duration Calculation', () => {
    it('should_return_detailed_result_with_timestamps', () => {
      const { start, end } = createTimestampPair90Sec();
      const result = calculateDurationDetailed(start, end);

      expect(result).toHaveProperty('durationSeconds');
      expect(result).toHaveProperty('startTime');
      expect(result).toHaveProperty('endTime');
      expect(result.durationSeconds).toBe(90);
      expect(result.startTime).toEqual(start);
      expect(result.endTime).toEqual(end);
    });

    it('should_include_original_timestamps_in_result', () => {
      const { start, end } = createTimestampPair45Sec();
      const result = calculateDurationDetailed(start, end);

      expect(result.startTime.getTime()).toBe(start.getTime());
      expect(result.endTime.getTime()).toBe(end.getTime());
    });
  });

  describe('Minimum Duration Check', () => {
    it('should_require_charge_when_duration_exceeds_30_seconds', () => {
      const result = meetsMinimumDuration(31);
      expect(result).toBe(true);
    });

    it('should_not_charge_when_duration_equals_30_seconds', () => {
      const result = meetsMinimumDuration(30);
      expect(result).toBe(false);
    });

    it('should_not_charge_when_duration_below_30_seconds', () => {
      const result = meetsMinimumDuration(15);
      expect(result).toBe(false);
    });

    it('should_not_charge_when_duration_is_zero', () => {
      const result = meetsMinimumDuration(0);
      expect(result).toBe(false);
    });

    it('should_require_charge_at_boundary_31_seconds', () => {
      const result = meetsMinimumDuration(31);
      expect(result).toBe(true);
    });

    it('should_handle_large_durations', () => {
      const result = meetsMinimumDuration(3600); // 1 hour
      expect(result).toBe(true);
    });
  });

  describe('Integration with Fixtures', () => {
    it('should_calculate_45_second_conversation', () => {
      const { start, end, durationSeconds } = createTimestampPair90Sec();
      const result = calculateDuration(start, end);
      expect(result).toBe(durationSeconds);
    });

    it('should_calculate_30_second_conversation', () => {
      const { start, end, durationSeconds } = createTimestampPair30Sec();
      const result = calculateDuration(start, end);
      expect(result).toBe(durationSeconds);
    });

    it('should_calculate_15_second_conversation', () => {
      const { start, end, durationSeconds } = createTimestampPair15Sec();
      const result = calculateDuration(start, end);
      expect(result).toBe(durationSeconds);
    });

    it('should_calculate_31_second_boundary_conversation', () => {
      const { start, end, durationSeconds } = createTimestampPair31Sec();
      const result = calculateDuration(start, end);
      expect(result).toBe(durationSeconds);
      expect(meetsMinimumDuration(result)).toBe(true);
    });
  });
});

// Helper function for test
function createTimestampPair45Sec() {
  const start = new Date('2024-01-01T10:00:00Z');
  const end = new Date('2024-01-01T10:00:45Z');
  return {
    start,
    end,
    durationSeconds: 45,
  };
}
