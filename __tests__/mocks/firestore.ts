/**
 * Firestore Mocks
 * Provides mock implementations for Firestore operations
 */

import { vi } from 'vitest';

/**
 * Mock Firestore document snapshot
 */
export function createMockDocSnapshot(data: any, exists: boolean = true) {
  return {
    exists: () => exists,
    data: () => (exists ? data : undefined),
    id: 'mock-doc-id',
    ref: {
      id: 'mock-doc-id',
    },
  };
}

/**
 * Mock Firestore query snapshot
 */
export function createMockQuerySnapshot(docs: any[] = []) {
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs: docs.map((data, index) => ({
      ...createMockDocSnapshot(data),
      id: `doc-${index}`,
    })),
    forEach: vi.fn((callback) => {
      docs.forEach((data) => {
        callback(createMockDocSnapshot(data, true));
      });
    }),
  };
}

/**
 * Mock Firestore collection reference
 */
export function createMockCollectionReference(collectionName: string) {
  return {
    id: collectionName,
    path: collectionName,
    doc: vi.fn((docId: string) => createMockDocumentReference(docId)),
    add: vi.fn().mockResolvedValue({
      id: 'new-doc-id',
    }),
    get: vi.fn().mockResolvedValue(createMockQuerySnapshot()),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
}

/**
 * Mock Firestore document reference
 */
export function createMockDocumentReference(docId: string, data?: any) {
  return {
    id: docId,
    path: `collection/${docId}`,
    get: vi.fn().mockResolvedValue(createMockDocSnapshot(data, !!data)),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    collection: vi.fn().mockReturnValue(createMockCollectionReference('subcollection')),
  };
}

/**
 * Mock Firestore transaction
 */
export function createMockFirestoreTransaction() {
  const updates: Array<{ type: string; ref: any; data: any }> = [];

  return {
    get: vi.fn().mockImplementation((ref) => {
      return Promise.resolve(createMockDocSnapshot(ref._mockData, !!ref._mockData));
    }),
    set: vi.fn().mockImplementation((ref, data) => {
      updates.push({ type: 'set', ref, data });
      return undefined;
    }),
    update: vi.fn().mockImplementation((ref, data) => {
      updates.push({ type: 'update', ref, data });
      return undefined;
    }),
    delete: vi.fn().mockImplementation((ref) => {
      updates.push({ type: 'delete', ref, data: null });
      return undefined;
    }),
    _getUpdates: () => updates,
    _clearUpdates: () => updates.splice(0, updates.length),
  };
}

/**
 * Mock Firestore database with runTransaction
 */
export function createMockFirestoreDatabase() {
  return {
    collection: vi.fn().mockReturnValue(createMockCollectionReference('collection')),
    doc: vi.fn().mockReturnValue(createMockDocumentReference('doc-id')),
    runTransaction: vi.fn().mockImplementation(async (callback) => {
      const transaction = createMockFirestoreTransaction();
      return callback(transaction);
    }),
  };
}

/**
 * Creates a mock Firestore error
 */
export function createMockFirestoreError(code: string, message: string) {
  const error = new Error(message);
  (error as any).code = code;
  return error;
}

/**
 * Mock Firestore server timestamp
 */
export function createMockServerTimestamp() {
  return {
    _type: 'ServerTimestamp',
    toDate: () => new Date(),
  };
}
