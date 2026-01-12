import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJsonRequest, readJson } from './route-test-helpers';
import * as firebaseAdmin from '@/lib/firebase-admin';
import * as bearerAuth from '@/lib/bearer-auth';
import * as rateLimit from '@/lib/rateLimit';
import * as conversationStorage from '@/lib/conversation-storage';
import * as ownershipValidator from '@/lib/ownership-validator';
import * as redaction from '@/lib/redaction';
import { POST as startConversation } from '@/app/api/conversation/start/route';
import { POST as endConversation } from '@/app/api/conversation/end/route';
import { GET as listConversations } from '@/app/api/conversations/route';
import { GET as getConversation } from '@/app/api/conversations/[conversationId]/route';
import { GET as listAssessed } from '@/app/api/conversations/assessed/route';
import { OwnershipValidationError } from '@/lib/ownership-validator';

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock('@/lib/bearer-auth', () => ({
  verifyBearerUser: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiters: {
    strict: { isRateLimited: vi.fn() },
    api: { isRateLimited: vi.fn() },
  },
  getClientIP: vi.fn(() => '127.0.0.1'),
  createRateLimitHeaders: vi.fn(() => ({ 'x-ratelimit-remaining': '0' })),
}));

vi.mock('@/lib/conversation-storage', () => ({
  getConversationsForUser: vi.fn(),
  getConversationById: vi.fn(),
  userOwnsConversation: vi.fn(),
}));

vi.mock('@/lib/redaction', () => ({
  redactConversation: vi.fn((messages) => messages),
}));

describe('Conversation API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for conversation/start without valid token', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      error: 'Invalid token',
      status: 401,
    });

    const request = createJsonRequest('http://localhost/api/conversation/start', {
      body: { ageTier: 1, service: 'fire' },
    });
    const response = await startConversation(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe('unauthorized');
  });

  it('creates conversation record for valid start request', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.strict.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });

    const set = vi.fn();
    const doc = vi.fn(() => ({ id: 'conv-123', set }));
    const collection = vi.fn(() => ({ doc }));
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({ collection });

    const request = createJsonRequest('http://localhost/api/conversation/start', {
      body: { ageTier: 2, service: 'ambulance' },
    });
    const response = await startConversation(request);
    const body = await readJson<{ conversationId: string; status: string }>(response);

    expect(response.status).toBe(200);
    expect(body.status).toBe('active');
    expect(body.conversationId).toBe('conv-123');
    expect(set).toHaveBeenCalled();
  });

  it('returns 404 when conversation/end cannot find conversation', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.strict.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ get: vi.fn() })),
      })),
    });
    vi.spyOn(ownershipValidator, 'validateOwnership').mockRejectedValue(
      new OwnershipValidationError('conversation/not-found', 'Missing')
    );

    const request = createJsonRequest('http://localhost/api/conversation/end', {
      body: { conversationId: 'conv-404' },
    });
    const response = await endConversation(request);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(404);
    expect(body.error).toBe('conversation-not-found');
  });

  it('updates conversation on end for valid request', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.strict.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.spyOn(ownershipValidator, 'validateOwnership').mockResolvedValue({
      isOwner: true,
      userId: 'user-123',
      conversationId: 'conv-1',
      reason: 'owner',
    });

    const update = vi.fn();
    const doc = vi.fn(() => ({ update }));
    const collection = vi.fn(() => ({ doc }));
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({ collection });

    const request = createJsonRequest('http://localhost/api/conversation/end', {
      body: { conversationId: 'conv-1', messages: [] },
    });
    const response = await endConversation(request);
    const body = await readJson<{ status: string }>(response);

    expect(response.status).toBe(200);
    expect(body.status).toBe('completed');
    expect(update).toHaveBeenCalled();
  });

  it('lists conversations for authenticated user', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(conversationStorage.getConversationsForUser).mockResolvedValue([
      { id: 'conv-1' },
    ]);

    const request = new Request('http://localhost/api/conversations?limit=25');
    const response = await listConversations(request as Request as any);
    const body = await readJson<{ success: boolean; conversations: { id: string }[] }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.conversations[0].id).toBe('conv-1');
  });

  it('returns 404 when conversation detail missing', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });
    vi.mocked(conversationStorage.userOwnsConversation).mockResolvedValue(true);
    vi.mocked(conversationStorage.getConversationById).mockResolvedValue(null);

    const request = new Request(
      'http://localhost/api/conversations/conv-404'
    );
    const response = await getConversation(
      request as Request as any,
      { params: Promise.resolve({ conversationId: 'conv-404' }) } as any
    );
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(404);
    expect(body.error).toBe('not-found');
  });

  it('returns empty list when no assessed conversations exist', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({ userId: 'user-123' });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: false,
      remaining: 10,
      resetTime: Date.now() + 1000,
    });

    const userDoc = {
      exists: true,
      data: () => ({ conversations: [] }),
    };
    const collection = vi.fn((name: string) => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue(userDoc),
      })),
      where: vi.fn(),
    }));
    vi.mocked(firebaseAdmin.getAdminDb).mockReturnValue({ collection });

    const request = new Request('http://localhost/api/conversations/assessed');
    const response = await listAssessed(request as Request as any);
    const body = await readJson<{ success: boolean; conversations: unknown[] }>(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.conversations).toHaveLength(0);
  });

  it('returns 429 when assessed conversations are rate limited', async () => {
    vi.mocked(bearerAuth.verifyBearerUser).mockResolvedValue({
      userId: 'user-123',
    });
    vi.mocked(rateLimit.rateLimiters.api.isRateLimited).mockResolvedValue({
      limited: true,
      remaining: 0,
      resetTime: Date.now() + 1000,
    });

    const request = new Request('http://localhost/api/conversations/assessed');
    const response = await listAssessed(request as Request as any);
    const body = await readJson<{ error: string }>(response);

    expect(response.status).toBe(429);
    expect(body.error).toBe('rate_limited');
  });
});
