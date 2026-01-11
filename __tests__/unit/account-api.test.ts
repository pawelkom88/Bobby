import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAccount } from '../../lib/api/account';
import { ApiError } from '../../lib/api/errors';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('account api', () => {
  it('deleteAccount returns success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true, message: 'ok' }),
    });

    const response = await deleteAccount('token');

    expect(response.success).toBe(true);
  });

  it('deleteAccount throws ApiError on failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({ success: false, message: 'Failed' }),
    });

    await expect(deleteAccount('token')).rejects.toBeInstanceOf(ApiError);
  });
});
