/**
 * Test Helpers
 * Common assertions and utilities for tests
 */

import { expect } from 'vitest';

/**
 * Asserts that a function throws an error with a specific message
 */
export async function expectErrorWithMessage(
  fn: () => Promise<any> | any,
  expectedMessage: string | RegExp
) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    throw new Error('Expected function to throw an error');
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    if (expectedMessage instanceof RegExp) {
      expect(errorMessage).toMatch(expectedMessage);
    } else {
      expect(errorMessage).toContain(expectedMessage);
    }
  }
}

/**
 * Asserts that a function throws an error with a specific code
 */
export async function expectErrorWithCode(
  fn: () => Promise<any> | any,
  expectedCode: string
) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    throw new Error('Expected function to throw an error');
  } catch (error: unknown) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;
    expect(errorCode).toBe(expectedCode);
  }
}

/**
 * Asserts that two dates are approximately equal (within milliseconds)
 */
export function expectDatesApproxEqual(
  actual: Date,
  expected: Date,
  toleranceMs: number = 1000
) {
  const diff = Math.abs(actual.getTime() - expected.getTime());
  expect(diff).toBeLessThanOrEqual(toleranceMs);
}

/**
 * Asserts that a value is within a range
 */
export function expectInRange(
  value: number,
  min: number,
  max: number
) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Asserts that an object has specific keys
 */
export function expectHasKeys(
  obj: Record<string, any>,
  keys: string[]
) {
  keys.forEach((key) => {
    expect(obj).toHaveProperty(key);
  });
}

/**
 * Asserts that an object does not have specific keys
 */
export function expectDoesNotHaveKeys(
  obj: Record<string, any>,
  keys: string[]
) {
  keys.forEach((key) => {
    expect(obj).not.toHaveProperty(key);
  });
}

/**
 * Asserts that a value is a valid ISO 8601 date string
 */
export function expectValidISODate(value: string) {
  expect(() => new Date(value)).not.toThrow();
  expect(new Date(value).toISOString()).toBe(value);
}

/**
 * Asserts that a value is a valid UUID
 */
export function expectValidUUID(value: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
}

/**
 * Asserts that a value is a valid Firebase user ID
 */
export function expectValidFirebaseUserId(value: string) {
  expect(value).toBeTruthy();
  expect(typeof value).toBe('string');
  expect(value.length).toBeGreaterThan(0);
}

/**
 * Creates a mock HTTP request object
 */
export function createMockRequest(overrides?: any) {
  return {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer token-123',
    },
    body: {},
    ...overrides,
  };
}

/**
 * Creates a mock HTTP response object
 */
export function createMockResponse() {
  return {
    status: 200,
    statusCode: 200,
    headers: {},
    body: null,
    json: function(data: any) {
      this.body = data;
      return this;
    },
    status: function(code: number) {
      this.statusCode = code;
      this.status = code;
      return this;
    },
    send: function(data: any) {
      this.body = data;
      return this;
    },
    setHeader: function(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
  };
}

/**
 * Asserts that a response has a specific status code
 */
export function expectResponseStatus(response: any, expectedStatus: number) {
  expect(response.statusCode || response.status).toBe(expectedStatus);
}

/**
 * Asserts that a response body contains specific properties
 */
export function expectResponseBody(response: any, expectedProperties: Record<string, any>) {
  const body = response.body || response;
  Object.entries(expectedProperties).forEach(([key, value]) => {
    expect(body[key]).toBe(value);
  });
}
