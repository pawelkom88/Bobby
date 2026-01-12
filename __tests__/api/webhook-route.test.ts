import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as webhook } from '@/app/api/webhook/route';
import { createTextRequest, readJson } from './route-test-helpers';
import { stripe } from '@/lib/stripe';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
}));

describe('Webhook API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('rejects requests without stripe-signature header', async () => {
    const request = createTextRequest('http://localhost/api/webhook', {
      body: '{}',
    });
    const response = await webhook(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing stripe-signature header');
  });

  it('rejects invalid webhook signatures', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('bad signature');
    });

    const request = createTextRequest('http://localhost/api/webhook', {
      body: '{"type":"checkout.session.completed","data":{"object":{}}}',
      headers: { 'stripe-signature': 'sig' },
    });
    const response = await webhook(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Webhook signature verification failed');
  });
});
