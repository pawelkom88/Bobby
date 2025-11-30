/**
 * Token Fixtures
 * Provides factory functions for creating test tokens
 */

import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Creates a valid Firebase ID token
 */
export function createValidToken(overrides?: Partial<DecodedIdToken>): DecodedIdToken {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: 'https://securetoken.google.com/bobby-project',
    aud: 'bobby-project',
    auth_time: now - 3600,
    user_id: 'user-123',
    uid: 'user-123',
    sub: 'user-123',
    iat: now - 3600,
    exp: now + 3600, // Expires in 1 hour
    email: 'test@example.com',
    email_verified: true,
    firebase: {
      identities: {
        'email': ['test@example.com'],
      },
      sign_in_provider: 'password',
    },
    ...overrides,
  };
}

/**
 * Creates an expired Firebase ID token
 */
export function createExpiredToken(overrides?: Partial<DecodedIdToken>): DecodedIdToken {
  const now = Math.floor(Date.now() / 1000);
  return createValidToken({
    iat: now - 7200,
    exp: now - 3600, // Expired 1 hour ago
    ...overrides,
  });
}

/**
 * Creates a token for a specific user
 */
export function createTokenForUser(userId: string, overrides?: Partial<DecodedIdToken>): DecodedIdToken {
  return createValidToken({
    user_id: userId,
    uid: userId,
    sub: userId,
    ...overrides,
  });
}

/**
 * Creates a malformed token (invalid structure)
 */
export function createMalformedToken(): Partial<DecodedIdToken> {
  return {
    iss: 'invalid',
    // Missing required fields
  };
}

/**
 * Creates a revoked token (simulated by special flag)
 */
export function createRevokedToken(overrides?: Partial<DecodedIdToken>): DecodedIdToken {
  return createValidToken({
    user_id: 'revoked-user',
    sub: 'revoked-user',
    ...overrides,
  });
}
