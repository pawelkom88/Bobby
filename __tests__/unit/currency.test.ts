import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrencyConfig,
  getCurrencySymbol,
  formatPrice,
  getBasePrice,
} from '@/lib/currency';

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('currency helpers', () => {
  const originalEnv = process.env.NEXT_PUBLIC_CURRENCY;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_CURRENCY;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_CURRENCY = originalEnv;
  });

  it('uses locale-based defaults when env is not set', () => {
    const config = getCurrencyConfig('pl');

    expect(config.code).toBe('PLN');
    expect(getCurrencySymbol('pl')).toBe('zł');
  });

  it('falls back to defaults when env config is invalid', () => {
    process.env.NEXT_PUBLIC_CURRENCY = 'not-json';

    const config = getCurrencyConfig('pl');

    expect(config.code).toBe('PLN');
  });

  it('uses env currency config when provided', () => {
    process.env.NEXT_PUBLIC_CURRENCY = JSON.stringify({
      symbol: '$',
      code: 'USD',
      locale: 'en-US',
    });

    const config = getCurrencyConfig('en');

    expect(config.symbol).toBe('$');
    expect(config.code).toBe('USD');
    expect(config.locale).toBe('en-US');
  });

  it('formats prices with the correct symbol placement', () => {
    expect(formatPrice('10', 'en')).toBe('£10');
    expect(formatPrice('10', 'pl')).toBe('10zł');
  });

  it('strips currency symbols when returning base price', () => {
    expect(getBasePrice('£15')).toBe('15');
    expect(getBasePrice('10zł')).toBe('10');
  });
});
