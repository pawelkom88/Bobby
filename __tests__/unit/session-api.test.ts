import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSession, setAssessment } from '../../lib/api/session';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('session api', () => {
  it('fetchSession returns data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true, data: {} }),
    });

    const data = await fetchSession(async () => 'Bearer token');

    expect(data).toEqual({});
  });

  it('setAssessment posts payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
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
});
