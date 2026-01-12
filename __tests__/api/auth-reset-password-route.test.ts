import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';
import { readJson } from './route-test-helpers';
import * as rateLimit from '@/lib/rateLimit';
import * as emailUtils from '@/lib/email-utils';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: {
    auth: { isRateLimited: vi.fn() },
    passwordResetIp: { isRateLimited: vi.fn() },
    passwordResetIpEmail: { isRateLimited: vi.fn() },
    passwordResetCooldown: { isRateLimited: vi.fn() },
    passwordReset: { isRateLimited: vi.fn() },
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: vi.fn(),
}));

vi.mock('@/lib/mailer', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/lib/email-utils', () => ({
  hashForRateLimit: vi.fn(async () => 'hash'),
  isValidEmail: vi.fn(() => true),
  maskEmail: vi.fn((email: string) => email),
}));

describe('Reset password API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit.rateLimiters.auth.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(rateLimit.rateLimiters.passwordResetIp.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(rateLimit.rateLimiters.passwordResetIpEmail.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(rateLimit.rateLimiters.passwordResetCooldown.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(rateLimit.rateLimiters.passwordReset.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(emailUtils.isValidEmail).mockReturnValue(true);
  });

  it('rejects requests without JSON content-type', async () => {
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(415);
    expect(body.error).toBe('Content-Type must be application/json');
  });

  it('returns 429 when IP rate limit is exceeded', async () => {
    vi.mocked(rateLimit.rateLimiters.auth.isRateLimited).mockResolvedValue({
      limited: true,
      remaining: 0,
      resetTime: Date.now() + 1000,
    });

    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(429);
    expect(body.error).toBe('Too many requests. Please try again later.');
  });

  it('returns 400 for invalid JSON body', async () => {
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid-json',
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request body');
  });

  it('returns 400 for invalid email', async () => {
    vi.mocked(emailUtils.isValidEmail).mockReturnValue(false);

    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'bad' }),
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Valid email address is required');
  });

  it('returns success for honeypot submissions', async () => {
    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', company: 'bot' }),
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 when app URL is missing', async () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    try {
      const request = new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
      const response = await resetPassword(request as any);
      const body = await readJson<{ error: string }>(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    }
  });

  it('returns success when reset link is missing oobCode', async () => {
    const authModule = await import('@/lib/firebase-admin');
    vi.mocked(authModule.getAdminAuth).mockReturnValue({
      generatePasswordResetLink: vi
        .fn()
        .mockResolvedValue('https://example.com/reset'),
    } as any);
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 when email sending fails', async () => {
    const authModule = await import('@/lib/firebase-admin');
    const mailer = await import('@/lib/mailer');
    vi.mocked(authModule.getAdminAuth).mockReturnValue({
      generatePasswordResetLink: vi.fn().mockResolvedValue(
        'http://localhost:3000/reset?oobCode=code'
      ),
    } as any);
    vi.mocked(mailer.sendPasswordResetEmail).mockRejectedValue(
      new Error('fail')
    );
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const request = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const response = await resetPassword(request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to send reset email. Please try again.');
  });
});
