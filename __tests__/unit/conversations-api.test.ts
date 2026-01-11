import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAssessedConversations,
  fetchConversationDetail,
  fetchConversations,
} from '../../lib/api/conversations';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('conversations api', () => {
  it('fetchConversations returns list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        success: true,
        conversations: [
          {
            id: '1',
            service: 'fire',
            ageTier: 1,
            startedAt: '2024-01-01',
            messageCount: 2,
          },
        ],
      }),
    });

    const data = await fetchConversations(async () => 'Bearer token');

    expect(data).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/conversations',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('fetchConversationDetail returns conversation', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        success: true,
        conversation: {
          id: 'c1',
          userId: 'u1',
          ageTier: 2,
          service: 'ambulance',
          startedAt: '2024-01-01',
          status: 'completed',
          charged: true,
        },
      }),
    });

    const data = await fetchConversationDetail(
      'c1',
      async () => 'Bearer token'
    );

    expect(data.id).toBe('c1');
  });

  it('fetchAssessedConversations returns items', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        success: true,
        conversations: [
          {
            id: 'a1',
            service: 'police',
            ageTier: 3,
            startedAt: '2024-01-01',
            endedAt: '2024-01-02',
            messageCount: 1,
            xpEarned: 10,
          },
        ],
      }),
    });

    const data = await fetchAssessedConversations(async () => 'Bearer token');

    expect(data).toHaveLength(1);
  });
});
