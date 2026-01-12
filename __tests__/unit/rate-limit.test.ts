import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRateLimiter,
  createRateLimitHeaders,
  getClientIP,
  destroyAllLimiters,
} from '@/lib/rateLimit';

vi.mock('@/lib/env', () => ({
  isUpstashConfigured: vi.fn(() => false),
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn(() => ({}));
    limit() {
      return Promise.resolve({
        success: true,
        remaining: 0,
        reset: Date.now() + 1000,
      });
    }
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {}
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('rate limit helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    destroyAllLimiters();
    vi.useRealTimers();
  });

  it('limits requests after exceeding the max', async () => {
    const limiter = createRateLimiter(2, 1000, 'unit-test');

    await expect(limiter.isRateLimited('user')).resolves.toMatchObject({
      limited: false,
    });
    await expect(limiter.isRateLimited('user')).resolves.toMatchObject({
      limited: false,
    });
    await expect(limiter.isRateLimited('user')).resolves.toMatchObject({
      limited: true,
      remaining: 0,
    });
  });

  it('creates retry headers when limited', () => {
    const headers = createRateLimitHeaders({
      limited: true,
      remaining: 0,
      resetTime: Date.now() + 5000,
    });

    expect(headers['Retry-After']).toBeDefined();
    expect(headers['X-RateLimit-Remaining']).toBe('0');
  });

  it('extracts client IP from headers with fallback', () => {
    const forwarded = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1, 70.0.0.1' },
    });
    const invalid = new Request('http://localhost', {
      headers: { 'x-forwarded-for': 'not-an-ip' },
    });

    expect(getClientIP(forwarded)).toBe('203.0.113.1');
    expect(getClientIP(invalid)).toBe('127.0.0.1');
  });

  it('fails open when upstash limiter throws and failOpen is true', async () => {
    const env = await import('@/lib/env');
    vi.mocked(env.isUpstashConfigured).mockReturnValue(true);
    const upstash = await import('@upstash/ratelimit');
    vi.spyOn(upstash.Ratelimit.prototype, 'limit').mockRejectedValue(
      new Error('boom')
    );

    const limiter = createRateLimiter(2, 1000, 'upstash-open', {
      failOpen: true,
    });
    const result = await limiter.isRateLimited('user');

    expect(result.limited).toBe(false);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('fails closed when upstash limiter throws and failOpen is false', async () => {
    const env = await import('@/lib/env');
    vi.mocked(env.isUpstashConfigured).mockReturnValue(true);
    const upstash = await import('@upstash/ratelimit');
    vi.spyOn(upstash.Ratelimit.prototype, 'limit').mockRejectedValue(
      new Error('boom')
    );

    const limiter = createRateLimiter(2, 1000, 'upstash-closed', {
      failOpen: false,
    });
    const result = await limiter.isRateLimited('user');

    expect(result.limited).toBe(true);
  });
});
