import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as checkoutSession } from '@/app/api/checkout_sessions/route';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as authUtils from '@/lib/auth-utils';
import * as firebaseAdmin from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/auth-utils', () => ({
  extractAndValidateToken: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Headers({ host: 'localhost:3000' })),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    prices: { retrieve: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
  },
}));

vi.mock('@/lib/currency', () => ({
  getCurrencyConfig: vi.fn(() => ({ code: 'GBP' })),
}));

describe('Checkout sessions API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_BOBBY_PRICE_ID_ROOKIE_PACK = 'price_rookie';
    process.env.STRIPE_BOBBY_PRICE_ID_HERO_PACK = 'price_hero';
  });

  it('returns 401 when auth token is missing', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue(null);

    const request = createJsonRequest(
      'http://localhost/api/checkout_sessions?packType=rookie',
      { method: 'POST' }
    );
    const response = await checkoutSession(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid or missing authorization token');
  });

  it('returns 400 when packType is missing', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });

    const request = createJsonRequest('http://localhost/api/checkout_sessions', {
      method: 'POST',
    });
    const response = await checkoutSession(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing packType query parameter');
  });

  it('returns 500 when price metadata is invalid', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({
      uid: 'user-123',
    });
    vi.mocked(stripe.prices.retrieve).mockResolvedValue({
      metadata: {},
      product: {},
    } as any);

    const request = createJsonRequest(
      'http://localhost/api/checkout_sessions?packType=rookie',
      { method: 'POST' }
    );
    const response = await checkoutSession(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe(
      'Failed to create checkout session. Please try again.'
    );
  });

  it('returns 500 when session url is missing', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({
      uid: 'user-123',
    });
    vi.mocked(stripe.prices.retrieve).mockResolvedValue({
      metadata: { credits: '5' },
      product: {},
    } as any);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      url: null,
    } as any);

    const request = createJsonRequest(
      'http://localhost/api/checkout_sessions?packType=rookie',
      { method: 'POST' }
    );
    const response = await checkoutSession(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe(
      'Failed to create checkout session. Please try again.'
    );
  });
});
