import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateClientEnv, validateServerEnv, getServerEnv, isUpstashConfigured } from '@/lib/env';

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('env helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('validates server env with required values', () => {
    process.env.FIREBASE_PROJECT_ID = 'pid';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'key';
    process.env.STRIPE = 'sk_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec';
    process.env.STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK = 'price_1';
    process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK = 'price_2';
    process.env.STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK_PLN = 'price_3';
    process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK_PLN = 'price_4';
    process.env.DEEPGRAM_API_KEY = 'dg';
    process.env.SESSION_ENCRYPTION_KEY = 'secret';

    const result = validateServerEnv();

    expect(result.FIREBASE_PROJECT_ID).toBe('pid');
  });

  it('throws when server env is missing required values', () => {
    delete process.env.FIREBASE_PROJECT_ID;

    expect(() => validateServerEnv()).toThrow('Invalid server environment variables');
  });

  it('validates client env with optional fields', () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'key';
    const result = validateClientEnv();

    expect(result.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('key');
  });

  it('returns validated server env value', () => {
    process.env.FIREBASE_PROJECT_ID = 'pid';

    expect(getServerEnv('FIREBASE_PROJECT_ID')).toBe('pid');
  });

  it('detects upstash configuration', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    expect(isUpstashConfigured()).toBe(true);
  });
});
