import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendWelcomeEmail } from '../../lib/api/emails';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('emails api', () => {
  it('sendWelcomeEmail posts with auth', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
    });

    const response = await sendWelcomeEmail('token');

    expect(response.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/send-welcome-email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
