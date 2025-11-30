/**
 * Timestamp Fixtures
 * Provides factory functions for creating test timestamps
 */

export interface TimestampPair {
  start: Date;
  end: Date;
  durationSeconds: number;
}

/**
 * Creates a timestamp pair with 45 seconds duration
 */
export function createTimestampPair45Sec(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00Z');
  const end = new Date('2024-01-01T10:00:45Z');
  return {
    start,
    end,
    durationSeconds: 45,
  };
}

/**
 * Creates a timestamp pair with 90 seconds duration
 */
export function createTimestampPair90Sec(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00Z');
  const end = new Date('2024-01-01T10:01:30Z');
  return {
    start,
    end,
    durationSeconds: 90,
  };
}

/**
 * Creates a timestamp pair with 30 seconds duration
 */
export function createTimestampPair30Sec(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00Z');
  const end = new Date('2024-01-01T10:00:30Z');
  return {
    start,
    end,
    durationSeconds: 30,
  };
}

/**
 * Creates a timestamp pair with 15 seconds duration
 */
export function createTimestampPair15Sec(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00Z');
  const end = new Date('2024-01-01T10:00:15Z');
  return {
    start,
    end,
    durationSeconds: 15,
  };
}

/**
 * Creates a timestamp pair with 31 seconds duration (boundary)
 */
export function createTimestampPair31Sec(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00Z');
  const end = new Date('2024-01-01T10:00:31Z');
  return {
    start,
    end,
    durationSeconds: 31,
  };
}

/**
 * Creates a timestamp pair with 0 seconds duration (same time)
 */
export function createTimestampPair0Sec(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00Z');
  return {
    start,
    end: start,
    durationSeconds: 0,
  };
}

/**
 * Creates a timestamp pair spanning midnight
 */
export function createTimestampPairMidnight(): TimestampPair {
  const start = new Date('2024-01-01T23:59:00Z');
  const end = new Date('2024-01-02T00:01:00Z');
  return {
    start,
    end,
    durationSeconds: 120,
  };
}

/**
 * Creates a timestamp pair with millisecond precision
 */
export function createTimestampPairWithMilliseconds(): TimestampPair {
  const start = new Date('2024-01-01T10:00:00.000Z');
  const end = new Date('2024-01-01T10:00:45.500Z');
  return {
    start,
    end,
    durationSeconds: 45, // Should round/truncate to 45 seconds
  };
}

/**
 * Creates an invalid timestamp pair (end before start)
 */
export function createInvalidTimestampPairEndBeforeStart(): { start: Date; end: Date } {
  const start = new Date('2024-01-01T10:00:45Z');
  const end = new Date('2024-01-01T10:00:00Z');
  return { start, end };
}
