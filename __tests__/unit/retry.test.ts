import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry, retryWithFallback } from '@/lib/retry';

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('retry helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries until a call succeeds', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn();
    fn
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const promise = retry(fn, {
      maxRetries: 2,
      delayMs: 50,
      backoffMultiplier: 2,
      onRetry,
    });

    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('returns fallback value when retries fail', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const promise = retryWithFallback(fn, 'fallback', { maxRetries: 1 });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('fallback');
  });
});
