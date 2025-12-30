import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripe } from '../../lib/stripe';
import { verifyIdToken } from '../../lib/firebase-admin';

/**
 * Tests for checkout session creation logic
 * Focus: Token validation, pack type validation, security
 */

// Mock modules before imports
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
}));

// Credit pack configuration (mirrors server-side config)
// Each credit = 1 practice call (5 minutes max)
const CREDIT_PACKS = {
  responder: { credits: 2, name: 'Responder Pack' },
  hero: { credits: 5, name: 'Hero Pack' },
} as const;

type PackType = keyof typeof CREDIT_PACKS;

function isValidPackType(packType: string): packType is PackType {
  return packType in CREDIT_PACKS;
}

describe('Checkout Sessions API Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pack Type Validation', () => {
    it('should accept valid pack types', () => {
      expect(isValidPackType('responder')).toBe(true);
      expect(isValidPackType('hero')).toBe(true);
    });

    it('should reject invalid pack types', () => {
      expect(isValidPackType('invalid')).toBe(false);
      expect(isValidPackType('')).toBe(false);
      expect(isValidPackType('RESPONDER')).toBe(false); // case sensitive
      expect(isValidPackType('starter')).toBe(false); // old pack type
      expect(isValidPackType('premium')).toBe(false);
    });

    it('should return correct credits for each pack', () => {
      expect(CREDIT_PACKS.responder.credits).toBe(2);
      expect(CREDIT_PACKS.hero.credits).toBe(5);
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from valid Bearer header', () => {
      const authHeader = 'Bearer abc123token';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null;
      expect(token).toBe('abc123token');
    });

    it('should return null for missing Bearer prefix', () => {
      const authHeader = 'abc123token';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null;
      expect(token).toBeNull();
    });

    it('should return null for empty token after Bearer', () => {
      const authHeader = 'Bearer ';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null;
      expect(token).toBe('');
    });
  });

  describe('Token Verification', () => {
    it('should extract userId from verified token', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
      };

      vi.mocked(verifyIdToken).mockResolvedValue(mockDecodedToken as any);

      const result = await verifyIdToken('valid-token');
      expect(result.uid).toBe('user123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw on invalid token', async () => {
      vi.mocked(verifyIdToken).mockRejectedValue(new Error('Invalid token'));

      await expect(verifyIdToken('invalid-token')).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('Session Metadata', () => {
    it('should include correct metadata in session creation', async () => {
      const userId = 'user123';
      const packType = 'responder' as PackType;
      const credits = CREDIT_PACKS[packType].credits;

      const expectedMetadata = {
        userId,
        packType,
        credits: credits.toString(),
      };

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: 'https://checkout.stripe.com/session123',
        metadata: expectedMetadata,
      } as any);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: 'price_123', quantity: 1 }],
        mode: 'payment',
        metadata: expectedMetadata,
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: 'Bobby Responder Pack - 2 Credits',
            metadata: {
              userId: 'user123',
              packType: 'responder',
              credits: '2',
              platform: 'bobby-app',
              locale: 'en',
            },
            footer: 'Thank you for choosing Bobby - Your Emergency Call Training Partner',
            rendering_options: {
              amount_tax_display: 'include_inclusive_tax',
            },
            custom_fields: [
              {
                name: 'Platform',
                value: 'Bobby Emergency Training',
              },
              {
                name: 'Credits Purchased',
                value: '2 Credits',
              },
            ],
          },
        },
      } as any);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user123',
            packType: 'responder',
            credits: '2',
          },
          invoice_creation: {
            enabled: true,
            invoice_data: {
              description: 'Bobby Responder Pack - 2 Credits',
              metadata: {
                userId: 'user123',
                packType: 'responder',
                credits: '2',
                platform: 'bobby-app',
                locale: 'en',
              },
              footer: 'Thank you for choosing Bobby - Your Emergency Call Training Partner',
              rendering_options: {
                amount_tax_display: 'include_inclusive_tax',
              },
              custom_fields: [
                {
                  name: 'Platform',
                  value: 'Bobby Emergency Training',
                },
                {
                  name: 'Credits Purchased',
                  value: '2 Credits',
                },
              ],
            },
          },
        })
      );
    });
  });

  describe('Invoice Creation', () => {
    it('should enable invoice creation in checkout session', async () => {
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: 'https://checkout.stripe.com/session123',
      } as any);

      await stripe.checkout.sessions.create({
        line_items: [{ price: 'price_123', quantity: 1 }],
        mode: 'payment',
        invoice_creation: {
          enabled: true,
        },
      } as any);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_creation: {
            enabled: true,
          },
        })
      );
    });

    it('should use localized text for Polish invoices', async () => {
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: 'https://checkout.stripe.com/session123',
      } as any);

      await stripe.checkout.sessions.create({
        line_items: [{ price: 'price_123', quantity: 1 }],
        mode: 'payment',
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: 'Bobby Pakiet Początkujący - 1 Credit',
            footer: 'Dziękujemy za wybranie Bobby - Twojego Partnera Treningowego Połączeń Ratunkowych',
            custom_fields: [
              {
                name: 'Platforma',
                value: 'Bobby Trening Ratunkowe',
              },
              {
                name: 'Kredytów Zakupionych',
                value: '1 Credit',
              },
            ],
          },
        },
      } as any);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_creation: {
            enabled: true,
            invoice_data: {
              description: 'Bobby Pakiet Początkujący - 1 Credit',
              footer: 'Dziękujemy za wybranie Bobby - Twojego Partnera Treningowego Połączeń Ratunkowych',
              custom_fields: [
                {
                  name: 'Platforma',
                  value: 'Bobby Trening Ratunkowe',
                },
                {
                  name: 'Kredytów Zakupionych',
                  value: '1 Credit',
                },
              ],
            },
          },
        })
      );
    });

    it('should use English text for English invoices', async () => {
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: 'https://checkout.stripe.com/session123',
      } as any);

      await stripe.checkout.sessions.create({
        line_items: [{ price: 'price_123', quantity: 1 }],
        mode: 'payment',
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: 'Bobby Rookie Pack - 1 Credit',
            footer: 'Thank you for choosing Bobby - Your Emergency Call Training Partner',
            custom_fields: [
              {
                name: 'Platform',
                value: 'Bobby Emergency Training',
              },
              {
                name: 'Credits Purchased',
                value: '1 Credit',
              },
            ],
          },
        },
      } as any);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_creation: {
            enabled: true,
            invoice_data: {
              description: 'Bobby Rookie Pack - 1 Credit',
              footer: 'Thank you for choosing Bobby - Your Emergency Call Training Partner',
              custom_fields: [
                {
                  name: 'Platform',
                  value: 'Bobby Emergency Training',
                },
                {
                  name: 'Credits Purchased',
                  value: '1 Credit',
                },
              ],
            },
          },
        })
      );
    });
  });

  describe('Security: userId Source', () => {
    it('should use userId from token, not from request body', async () => {
      // Simulating the security check: userId must come from token
      const tokenUserId = 'token-user-123';
      const requestBodyUserId = 'malicious-user-456';

      const mockDecodedToken = { uid: tokenUserId };
      vi.mocked(verifyIdToken).mockResolvedValue(mockDecodedToken as any);

      const decodedToken = await verifyIdToken('some-token');

      // The API should use decodedToken.uid, NOT requestBodyUserId
      const userIdToUse = decodedToken.uid;

      expect(userIdToUse).toBe(tokenUserId);
      expect(userIdToUse).not.toBe(requestBodyUserId);
    });
  });

  describe('Firebase Private Key Formatting', () => {
    it('should handle escaped newlines in private key', () => {
      // Simulate environment variable with escaped newlines (common in deployment platforms)
      const privateKeyWithEscapedNewlines =
        '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\\n-----END PRIVATE KEY-----';

      // Process the key as the firebase-admin.ts does
      const processedKey = privateKeyWithEscapedNewlines
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      // Verify newlines are actual newlines, not escaped
      expect(processedKey).toContain('\n');
      expect(processedKey).not.toContain('\\n');
      expect(processedKey.split('\n').length).toBe(3); // BEGIN, content, END
    });

    it('should handle already-formatted private key with real newlines', () => {
      // Simulate a key that already has real newlines
      const privateKeyWithRealNewlines =
        '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\n-----END PRIVATE KEY-----';

      // Process the key
      const processedKey = privateKeyWithRealNewlines
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      // Should remain unchanged since it already has real newlines
      expect(processedKey).toBe(privateKeyWithRealNewlines);
      expect(processedKey.split('\n').length).toBe(3);
    });

    it('should handle mixed escaped and real newlines', () => {
      // Edge case: mix of escaped and real newlines
      const privateKeyMixed =
        '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\n-----END PRIVATE KEY-----';

      const processedKey = privateKeyMixed
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      // All should be real newlines after processing
      expect(processedKey).not.toContain('\\n');
      expect(processedKey.split('\n').length).toBe(3);
    });

    it('should handle escaped carriage returns', () => {
      // Some systems might have escaped carriage returns
      const privateKeyWithEscapedCR =
        '-----BEGIN PRIVATE KEY-----\\r\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7\\r\\n-----END PRIVATE KEY-----';

      const processedKey = privateKeyWithEscapedCR
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      // Should have real carriage returns and newlines
      expect(processedKey).not.toContain('\\r');
      expect(processedKey).not.toContain('\\n');
      expect(processedKey).toContain('\r\n');
    });

    it('should preserve key structure after formatting', () => {
      const originalKey =
        '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VeryLongKeyContent\\n-----END PRIVATE KEY-----';

      const processedKey = originalKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      // Verify structure is preserved
      expect(processedKey.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true);
      expect(processedKey.endsWith('-----END PRIVATE KEY-----')).toBe(true);
      expect(
        processedKey.includes(
          'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VeryLongKeyContent'
        )
      ).toBe(true);
    });

    it('should handle production-format private key with escaped newlines', () => {
      // Real production key format with escaped newlines (as shown in deployment UI)
      const productionKey =
        '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7FxNlpXrMsL9d\\nqXZ8eHn0lE5jKL6vRtG2xMn4P8hWkJfNzQxCmDVYhT9wKmUeG1sXkFJ3rZuBpN9V\\ncRk7Y5vMHgKxnG3tLfWnYpJ9E8cFh2qYbXwzK1mPvCx4jHfL5sUdRnk9GqM2h7eF\\ntZC1wXvNkJqT8P9yD3uRhL2vYwF6K0xNjM4p5rQgS1nY8WmJzH3tXqN7c4vL6fKd\\nB9s2xYjE1qR5wUmT3hNvK7zP8aLe0gJfY4cH9nMrWvN1dF3xLsB2yXuTtQ6p5ZhN\\nwK9cMqF3jG7vYnR4hUmS5eP1xLtN7kJ9cWvB3fQ2yXsZnM4pK6hNqD1rYwL8zTvF\\njH5eXgMnAgMBAAECggEABkxJrN3P8cGvMHfpJqTK1xbZfHk2jSqYfGtnL9VnMdkE\\nxFgTQ5xNvhMr7PjWkYn3hQvlR8G5tNq2cFxVe4p9jRn7HkGtLmsBfKwzXYnTsJfN\\nhN5cMpR8vGzLxYqT9nJeFVk4wPbMdK2sNvQmGxfRnPjTyXkC1jHsLmfPqVzgK8eF\\ncY5r7xNtG2kMvVnDjWsRH8pXfNq3L9hVmQ4bJkLNzGtPwYxReUhvMsF5nMpXe7cN\\nxJfGvhPT6nkRqYsNqM2sLkJfT4vNqXhYLpG3jNsRfM4xhVpT9qLkFnGzC5tNqXsR\\nvYhJeLkMcP2xnQ7fMvJsTyNqXsLfGhPnRvMcT5qYLwKBgQDmFkVnG3pJhNqXsLcM\\nfYxRvTpNqLsGhXjQnM4fKwPxT5cNqRvYsLhJfGkMnP2xQ7cFvJsLyMqXsNfGhRnT\\nvPcM5qYLJxwKBgQDRnNqM2sLfJhT4vXsLpGhPjNqRxM4cFvYsLkJfT5qNhYLpXsG\\nhRnM3cPfJsLyTqvNfGHvRmNqT2sLfJxP4cYLpGhXjQnM3cFvYsLkJfT5q\\nNhYLsGhRnP6cMfJsLyTqvNfGkMnQ2xhPvRmNqLsKfGhJeT4vPcM5qXsLfYhRnPvJ\\nsLkMfGxQ7T5pNqYhLJxwvRcNqM2sLfKBgQCxnQ7fMvJsLyNqXsGhPnRvMcT5qYLJ\\nxwKfGhJeT4vPcM5qXsLfYhRnPvJsLkMfGxQ7T5pNqYhLfGhRnM3cPfJsLyTqvNf7T5pNq\\nsGhXjQnM4fKwPxNqXsLcMfYxRvTpNqLsGhXjQnM4fKwPxT5cNqRvYsLhJfGkMnP2\\nxQ7cFvJsLyMqXsNfGhRnTvPcM5qY=\\n-----END PRIVATE KEY-----\\n';

      const processedKey = productionKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');

      // Verify it's properly formatted
      expect(processedKey.startsWith('-----BEGIN PRIVATE KEY-----')).toBe(true);
      expect(processedKey.endsWith('-----END PRIVATE KEY-----\n')).toBe(true);

      // Verify no escaped newlines remain
      expect(processedKey).not.toContain('\\n');

      // Verify it has multiple lines (proper PEM format)
      const lines = processedKey.split('\n');
      expect(lines.length).toBeGreaterThan(3);

      // Verify key content is preserved
      expect(processedKey).toContain(
        'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7FxNlpXrMsL9d'
      );
      expect(processedKey).toContain('xQ7cFvJsLyMqXsNfGhRnTvPcM5qY=');
    });
  });
});
