import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createCheckoutSession } from '../../lib/api/checkout';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('createCheckoutSession', () => {
  it('calls the checkout endpoint with auth and returns the URL', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ url: 'https://checkout.example.com' }),
    });

    const response = await createCheckoutSession(
      { locale: 'en', packType: 'hero' },
      'token-123'
    );

    expect(response).toEqual({ url: 'https://checkout.example.com' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/checkout_sessions?locale=en&packType=hero',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws when the response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: 'Failed' }),
    });

    await expect(
      createCheckoutSession({ locale: 'en', packType: 'rookie' }, 'token-123')
    ).rejects.toThrow('HTTP 500');
  });
});
