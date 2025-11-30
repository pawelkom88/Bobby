/**
 * Firebase Admin Mocks
 * Provides mock implementations for Firebase Admin SDK
 */

import { vi } from 'vitest';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Mock Firebase Admin Auth
 */
export const mockFirebaseAdmin = {
  auth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
};

/**
 * Creates a mock verifyIdToken function that succeeds
 */
export function createMockVerifyIdTokenSuccess(token: DecodedIdToken) {
  return vi.fn().mockResolvedValue(token);
}

/**
 * Creates a mock verifyIdToken function that throws auth error
 */
export function createMockVerifyIdTokenAuthError() {
  return vi.fn().mockRejectedValue(
    new Error('Firebase ID token has expired. Get a fresh ID token from your client.')
  );
}

/**
 * Creates a mock verifyIdToken function that throws malformed error
 */
export function createMockVerifyIdTokenMalformedError() {
  return vi.fn().mockRejectedValue(
    new Error('Illegal argument provided to fromBase64Url().')
  );
}

/**
 * Creates a mock verifyIdToken function that throws revoked error
 */
export function createMockVerifyIdTokenRevokedError() {
  return vi.fn().mockRejectedValue(
    new Error('Firebase ID token has been revoked.')
  );
}

/**
 * Mock Firestore Database
 */
export const mockFirestoreDb = {
  collection: vi.fn(),
  doc: vi.fn(),
  transaction: vi.fn(),
  runTransaction: vi.fn(),
};

/**
 * Creates a mock Firestore document reference
 */
export function createMockDocRef(data?: any) {
  return {
    get: vi.fn().mockResolvedValue({
      exists: () => !!data,
      data: () => data,
      id: 'mock-doc-id',
    }),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a mock Firestore collection reference
 */
export function createMockCollectionRef() {
  return {
    doc: vi.fn(),
    add: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    get: vi.fn(),
  };
}

/**
 * Creates a mock Firestore transaction
 */
export function createMockTransaction() {
  return {
    get: vi.fn(),
    set: vi.fn().mockReturnValue(undefined),
    update: vi.fn().mockReturnValue(undefined),
    delete: vi.fn().mockReturnValue(undefined),
  };
}

/**
 * Creates a mock runTransaction function
 */
export function createMockRunTransaction(callback?: (transaction: any) => Promise<any>) {
  return vi.fn().mockImplementation(async (cb) => {
    const mockTransaction = createMockTransaction();
    if (callback) {
      return callback(mockTransaction);
    }
    return cb(mockTransaction);
  });
}
