import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  generateCSRFToken,
  validateCSRFToken,
  requireCSRF,
  getClientCSRFToken,
} from '@/lib/csrf';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('csrf helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a base64url token', () => {
    const token = generateCSRFToken();

    expect(token.length).toBeGreaterThan(10);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('validates matching header and cookie tokens', async () => {
    const request = new NextRequest('http://localhost', {
      headers: {
        'x-csrf-token': 'token-123',
        cookie: 'csrf_token=token-123',
      },
    });

    await expect(validateCSRFToken(request)).resolves.toBe(true);
  });

  it('rejects when header or cookie is missing', async () => {
    const missingHeader = new NextRequest('http://localhost', {
      headers: { cookie: 'csrf_token=token-123' },
    });
    const missingCookie = new NextRequest('http://localhost', {
      headers: { 'x-csrf-token': 'token-123' },
    });

    await expect(validateCSRFToken(missingHeader)).resolves.toBe(false);
    await expect(validateCSRFToken(missingCookie)).resolves.toBe(false);
  });

  it('skips CSRF checks for safe methods and bearer auth', async () => {
    const getRequest = new NextRequest('http://localhost', { method: 'GET' });
    const authRequest = new NextRequest('http://localhost', {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
    });

    expect(await requireCSRF(getRequest)).toBeNull();
    expect(await requireCSRF(authRequest)).toBeNull();
  });

  it('returns 403 response for invalid CSRF token', async () => {
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      headers: { cookie: 'csrf_token=token-123' },
    });

    const response = await requireCSRF(request);
    expect(response?.status).toBe(403);
  });

  it('returns existing CSRF token from cookies', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'existing-token' })),
    } as any);

    await expect(getClientCSRFToken()).resolves.toBe('existing-token');
  });
});
