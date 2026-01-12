import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as sendWelcome } from '@/app/api/send-welcome-email/route';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as authUtils from '@/lib/auth-utils';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as mailer from '@/lib/mailer';
import * as rateLimit from '@/lib/rateLimit';

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
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/mailer', () => ({
  sendWelcomeEmail: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: {
    welcomeEmail: { isRateLimited: vi.fn() },
  },
  createRateLimitHeaders: vi.fn(() => ({})),
}));

describe('Send welcome email API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when authorization is missing', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue(null);

    const request = createJsonRequest('http://localhost/api/send-welcome-email');
    const response = await sendWelcome(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid or missing authorization token');
  });

  it('returns alreadySent when welcome email was previously sent', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      name: 'Test',
    });
    vi.mocked(rateLimit.rateLimiters.welcomeEmail.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({ welcomeEmailSent: true }),
          }),
        })),
      })),
    });

    const request = createJsonRequest('http://localhost/api/send-welcome-email');
    const response = await sendWelcome(request);
    const body = await readJson<{ alreadySent?: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.alreadySent).toBe(true);
    expect(mailer.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
