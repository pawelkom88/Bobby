import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deductCredits, endConversation, startConversation } from '../../lib/api/conversation';
import { ApiError } from '../../lib/api/errors';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('conversation actions api', () => {
  it('startConversation returns data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        conversationId: 'c1',
        startedAt: '2024-01-01',
        status: 'ok',
      }),
    });

    const data = await startConversation(
      { ageTier: 1, service: 'fire' },
      'token'
    );

    expect(data.conversationId).toBe('c1');
  });

  it('endConversation returns data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        conversationId: 'c1',
        endedAt: '2024-01-02',
        status: 'ok',
      }),
    });

    const data = await endConversation(
      { conversationId: 'c1', messages: [] },
      'token'
    );

    expect(data.endedAt).toBe('2024-01-02');
  });

  it('deductCredits throws ApiError on failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 402,
      statusText: 'Payment Required',
      json: async () => ({ message: 'Insufficient credits' }),
    });

    await expect(deductCredits('c1', 'token')).rejects.toBeInstanceOf(ApiError);
    await expect(deductCredits('c1', 'token')).rejects.toMatchObject({
      status: 402,
    });
  });
});
