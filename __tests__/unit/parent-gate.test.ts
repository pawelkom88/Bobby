import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getParentGateDateKey,
  hasParentGateAcknowledgement,
  PARENT_GATE_SESSION_KEY,
  setParentGateAcknowledgement,
} from '../../lib/parent-gate';

type StorageMock = Storage & {
  getItem: ReturnType<typeof vi.fn<(key: string) => string | null>>;
  setItem: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
  removeItem: ReturnType<typeof vi.fn<(key: string) => void>>;
  clear: ReturnType<typeof vi.fn<() => void>>;
  key: ReturnType<typeof vi.fn<(index: number) => string | null>>;
};

const mockSessionStorage = (): StorageMock => {
  let storage: Record<string, string> = {};

  const storageObject: StorageMock = {
    get length() {
      return Object.keys(storage).length;
    },
    key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = {};
    }),
  };

  return storageObject;
};

describe('parent-gate helpers', () => {
  const originalWindow = globalThis.window;
  const originalSessionStorage = globalThis.window?.sessionStorage;
  const fixedDate = new Date('2024-11-05T12:34:56.789Z');
  let sessionStorageMock: ReturnType<typeof mockSessionStorage>;
  const setWindow = (value: Window & typeof globalThis | undefined) => {
    Object.defineProperty(globalThis, 'window', {
      value,
      configurable: true,
      writable: true,
    });
  };
  const setSessionStorage = (value: Storage | undefined) => {
    if (!globalThis.window) return;
    Object.defineProperty(globalThis.window, 'sessionStorage', {
      value,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);

    sessionStorageMock = mockSessionStorage();

    if (!globalThis.window) {
      setWindow(originalWindow);
    }
    setSessionStorage(sessionStorageMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    setWindow(originalWindow);
    setSessionStorage(originalSessionStorage);
  });

  describe('getParentGateDateKey', () => {
    it('returns ISO date string (YYYY-MM-DD) for current day', () => {
      expect(getParentGateDateKey()).toBe('2024-11-05');
    });

    it('pads month and day with leading zeros', () => {
      const paddedDate = new Date('2024-01-09T00:00:00Z');

      vi.setSystemTime(paddedDate);

      expect(getParentGateDateKey()).toBe('2024-01-09');
    });
  });

  describe('hasParentGateAcknowledgement', () => {
    it('returns false when window is undefined (server-side)', () => {
      setWindow(undefined as unknown as Window & typeof globalThis);

      expect(hasParentGateAcknowledgement()).toBe(false);
    });

    it('returns false when no acknowledgement stored', () => {
      expect(hasParentGateAcknowledgement()).toBe(false);
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith(
        PARENT_GATE_SESSION_KEY
      );
    });

    it('returns true when stored date matches current date', () => {
      sessionStorageMock.getItem.mockReturnValue('2024-11-05');

      expect(hasParentGateAcknowledgement()).toBe(true);
    });

    it('returns false when stored date differs from current date', () => {
      sessionStorageMock.getItem.mockReturnValue('2024-11-04');

      expect(hasParentGateAcknowledgement()).toBe(false);
    });
  });

  describe('setParentGateAcknowledgement', () => {
    it('is a no-op when window is undefined', () => {
      setWindow(undefined as unknown as Window & typeof globalThis);

      expect(() => setParentGateAcknowledgement()).not.toThrow();
    });

    it('writes current date to session storage', () => {
      setParentGateAcknowledgement();

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        PARENT_GATE_SESSION_KEY,
        '2024-11-05'
      );
    });
  });
});
