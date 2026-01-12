import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as sessionStorage from '@/lib/session-storage';
import * as sessionRequest from '@/lib/session-request';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as authUtils from '@/lib/auth-utils';
import * as rateLimit from '@/lib/rateLimit';
import { GET as getSession } from '@/app/api/session/get/route';
import { POST as setAssessment } from '@/app/api/session/assessment/route';
import { POST as clearSession } from '@/app/api/session/clear/route';
import { POST as setConversationComplete } from '@/app/api/session/complete/route';
import { POST as setConversationId } from '@/app/api/session/conversation-id/route';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/session-storage', () => ({
  getAllSessionData: vi.fn(),
  setAssessmentData: vi.fn(),
  setCompletionId: vi.fn(),
  clearAllSessionValues: vi.fn(),
  setConversationComplete: vi.fn(),
  setConversationId: vi.fn(),
}));

vi.mock('@/lib/session-request', () => ({
  requireSessionUser: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('@/lib/auth-utils', () => ({
  extractAndValidateToken: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: {
    strict: { isRateLimited: vi.fn() },
    api: { isRateLimited: vi.fn() },
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({ 'x-ratelimit-remaining': '0' })),
}));

describe('Session API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session/get has missing auth token', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue(null);

    const request = createJsonRequest('http://localhost/api/session/get', {
      method: 'GET',
    });
    const response = await getSession(request);
    const body = await readJson<{ success: boolean; error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid or missing authorization token');
  });

  it('returns session data when authenticated', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(sessionStorage.getAllSessionData).mockResolvedValue({
      completionId: 'completion-1',
    });

    const request = createJsonRequest('http://localhost/api/session/get', {
      method: 'GET',
    });
    const response = await getSession(request);
    const body = await readJson<{ success: boolean; data: { completionId?: string } }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.completionId).toBe('completion-1');
  });

  it('stores assessment data when valid', async () => {
    vi.mocked(sessionRequest.requireSessionUser).mockResolvedValue({ userId: 'user-123' });

    const request = createJsonRequest(
      'http://localhost/api/session/assessment',
      {
        body: {
          assessment: { score: 3 },
          completionId: 'completion-123',
        },
      }
    );
    const response = await setAssessment(request);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sessionStorage.setAssessmentData).toHaveBeenCalled();
    expect(sessionStorage.setCompletionId).toHaveBeenCalledWith('completion-123');
  });

  it('returns 400 for missing assessment data', async () => {
    vi.mocked(sessionRequest.requireSessionUser).mockResolvedValue({ userId: 'user-123' });

    const request = createJsonRequest(
      'http://localhost/api/session/assessment',
      { body: { completionId: 'completion-123' } }
    );
    const response = await setAssessment(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing assessment or completionId');
  });

  it('clears session values for authenticated users', async () => {
    vi.mocked(sessionRequest.requireSessionUser).mockResolvedValue({ userId: 'user-123' });

    const request = createJsonRequest('http://localhost/api/session/clear');
    const response = await clearSession(request);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sessionStorage.clearAllSessionValues).toHaveBeenCalled();
  });

  it('marks conversation complete when valid', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });

    const request = createJsonRequest(
      'http://localhost/api/session/complete',
      { body: { complete: true } }
    );
    const response = await setConversationComplete(request);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sessionStorage.setConversationComplete).toHaveBeenCalledWith('user-123', true);
  });

  it('stores conversation ID when valid', async () => {
    vi.mocked(authUtils.extractAndValidateToken).mockReturnValue('token');
    vi.mocked(firebaseAdmin.verifyIdToken).mockResolvedValue({ uid: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.strict.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });

    const request = createJsonRequest(
      'http://localhost/api/session/conversation-id',
      { body: { conversationId: 'conv-123' } }
    );
    const response = await setConversationId(request);
    const body = await readJson<{ success: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sessionStorage.setConversationId).toHaveBeenCalledWith('conv-123');
  });

  it('returns 401 for session routes when auth fails', async () => {
    const unauthorized = NextResponse.json(
      { error: 'Invalid or missing authorization token' },
      { status: 401 }
    );
    vi.mocked(sessionRequest.requireSessionUser).mockResolvedValue(unauthorized);

    const request = createJsonRequest('http://localhost/api/session/clear');
    const response = await clearSession(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid or missing authorization token');
  });
});
