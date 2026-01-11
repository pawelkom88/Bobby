import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetPassword } from '../../lib/api/auth';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('auth api', () => {
  it('resetPassword returns success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
    });

    const response = await resetPassword({ email: 'test@example.com' });

    expect(response.success).toBe(true);
  });
});
