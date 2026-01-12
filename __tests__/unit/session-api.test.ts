import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSession,
  fetchSession,
  setAssessment,
  setConversationComplete,
  setConversationId,
} from '../../lib/api/session';
import * as fetcher from '@/lib/fetcher';

vi.mock('@/lib/fetcher', () => ({
  authenticatedFetch: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('session api', () => {
  it('fetchSession returns data', async () => {
    vi.mocked(fetcher.authenticatedFetch).mockResolvedValue({
      success: true,
      data: {},
    });

    const data = await fetchSession(async () => 'Bearer token');

    expect(data).toEqual({});
  });

  it('fetchSession throws when response is not successful', async () => {
    vi.mocked(fetcher.authenticatedFetch).mockResolvedValue({
      success: false,
      error: 'nope',
    });

    await expect(fetchSession(async () => 'Bearer token')).rejects.toThrow(
      'nope'
    );
  });

  it('setAssessment posts payload', async () => {
    vi.mocked(fetcher.authenticatedFetch).mockResolvedValue({
      success: true,
    });

    const response = await setAssessment(
      {
        assessment: {
          assessment: {
            score: 1,
            passed: true,
            positives: [],
            improvements: [],
            warnings: [],
            metrics: { userTurns: 1, durationSeconds: 10 },
          },
          passed: true,
        },
        completionId: 'c1',
      },
      async () => 'Bearer token'
    );

    expect(response.success).toBe(true);
  });

  it('setConversationId throws on failure', async () => {
    vi.mocked(fetcher.authenticatedFetch).mockResolvedValue({
      success: false,
      error: 'failed',
    });

    await expect(
      setConversationId('conv-1', async () => 'Bearer token')
    ).rejects.toThrow('failed');
  });

  it('setConversationComplete throws on failure', async () => {
    vi.mocked(fetcher.authenticatedFetch).mockResolvedValue({
      success: false,
      error: 'failed',
    });

    await expect(
      setConversationComplete(true, async () => 'Bearer token')
    ).rejects.toThrow('failed');
  });

  it('clearSession throws on failure', async () => {
    vi.mocked(fetcher.authenticatedFetch).mockResolvedValue({
      success: false,
      error: 'failed',
    });

    await expect(clearSession(async () => 'Bearer token')).rejects.toThrow(
      'failed'
    );
  });
});
