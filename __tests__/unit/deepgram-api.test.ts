import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDeepgramToken } from '../../lib/api/deepgram';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('deepgram api', () => {
  it('fetchDeepgramToken returns access token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ access_token: 'dg-token', expires_in: 60 }),
    });

    const response = await fetchDeepgramToken('token');

    expect(response.access_token).toBe('dg-token');
  });
});
