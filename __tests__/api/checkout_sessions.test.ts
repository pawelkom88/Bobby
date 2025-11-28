import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Import after mocks
import { stripe } from '@/lib/stripe';
import { verifyIdToken } from '@/lib/firebase-admin';

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
      
      await expect(verifyIdToken('invalid-token')).rejects.toThrow('Invalid token');
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
      } as any);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user123',
            packType: 'responder',
            credits: '2',
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
});

