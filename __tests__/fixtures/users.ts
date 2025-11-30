/**
 * User Fixtures
 * Provides factory functions for creating test users
 */

export interface TestUser {
  id: string;
  email: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a basic user
 */
export function createUser(overrides?: Partial<TestUser>): TestUser {
  const now = new Date();
  return {
    id: 'user-123',
    email: 'test@example.com',
    credits: 5,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a user with 5 credits
 */
export function createUserWith5Credits(overrides?: Partial<TestUser>): TestUser {
  return createUser({
    credits: 5,
    ...overrides,
  });
}

/**
 * Creates a user with 0 credits
 */
export function createUserWith0Credits(overrides?: Partial<TestUser>): TestUser {
  return createUser({
    credits: 0,
    ...overrides,
  });
}

/**
 * Creates a user with 1 credit
 */
export function createUserWith1Credit(overrides?: Partial<TestUser>): TestUser {
  return createUser({
    credits: 1,
    ...overrides,
  });
}

/**
 * Creates a user with 10 credits
 */
export function createUserWith10Credits(overrides?: Partial<TestUser>): TestUser {
  return createUser({
    credits: 10,
    ...overrides,
  });
}
