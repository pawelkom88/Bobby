import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as authenticate } from '@/app/api/authenticate/route';
import { readJson } from './route-test-helpers';
import * as deepgram from '@deepgram/sdk';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as authUtils from '@/lib/auth-utils';
import * as rateLimit from '@/lib/rateLimit';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@deepgram/sdk', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/auth-utils', () => ({
  extractAndValidateToken: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: {
    api: { isRateLimited: vi.fn() },
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({})),
}));

describe('Authenticate API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when auth token is missing', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue(null);

    const response = await authenticate(new Request('http://localhost/api/authenticate') as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid or missing authorization token');
  });

  it('returns 403 when user has no credits', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            data: () => ({ credits: 0 }),
          }),
        })),
      })),
    });

    const response = await authenticate(new Request('http://localhost/api/authenticate') as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toContain('Insufficient credits');
  });

  it('returns a Deepgram token when credits are available', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            data: () => ({ credits: 2 }),
          }),
        })),
      })),
    });
    vi.mocked(deepgram.createClient).mockReturnValue({
      auth: {
        grantToken: vi.fn().mockResolvedValue({
          result: { token: 'dg-token', expires_in: 60 },
          error: null,
        }),
      },
    });

    const response = await authenticate(new Request('http://localhost/api/authenticate') as any);
    const body = await readJson<{ token: string }>(response);

    expect(response.status).toBe(200);
    expect(body.token).toBe('dg-token');
  });
});
