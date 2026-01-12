/**
 * Authentication Tests
 * Tests for Firebase ID token verification
 */

import { describe, it, expect, vi } from 'vitest';
import {
  verifyToken,
  extractUserIdFromToken,
  isTokenExpired,
  TokenVerificationError,
} from '@/lib/token-verifier';
import {
  createValidToken,
  createExpiredToken,
  createTokenForUser,
  createMalformedToken,
  createRevokedToken,
} from '../fixtures/tokens';

describe('Authentication - Token Verification', () => {
  describe('Valid Token Scenarios', () => {
    it('should_accept_valid_firebase_token', async () => {
      const validToken = createValidToken();
      const mockVerifyFn = vi.fn().mockResolvedValue(validToken);

      const result = await verifyToken(mockVerifyFn, 'valid-token-string');

      expect(result.success).toBe(true);
      expect(result.uid).toBe(validToken.uid);
      expect(result.decodedToken).toEqual(validToken);
      expect(mockVerifyFn).toHaveBeenCalledWith('valid-token-string');
    });

    it('should_extract_uid_from_token', async () => {
      const validToken = createValidToken();
      const mockVerifyFn = vi.fn().mockResolvedValue(validToken);

      const result = await verifyToken(mockVerifyFn, 'valid-token-string');

      expect(result.uid).toBe('user-123');
      expect(result.uid).toBeTruthy();
      expect(typeof result.uid).toBe('string');
    });

    it('should_accept_token_for_specific_user', async () => {
      const userToken = createTokenForUser('user-456');
      const mockVerifyFn = vi.fn().mockResolvedValue(userToken);

      const result = await verifyToken(mockVerifyFn, 'token-for-user-456');

      expect(result.success).toBe(true);
      expect(result.uid).toBe('user-456');
    });

    it('should_return_decoded_token_with_all_claims', async () => {
      const validToken = createValidToken();
      const mockVerifyFn = vi.fn().mockResolvedValue(validToken);

      const result = await verifyToken(mockVerifyFn, 'valid-token');

      expect(result.decodedToken).toHaveProperty('uid');
      expect(result.decodedToken).toHaveProperty('email');
      expect(result.decodedToken).toHaveProperty('iat');
      expect(result.decodedToken).toHaveProperty('exp');
    });
  });

  describe('Invalid Token Scenarios', () => {
    it('should_reject_expired_token', async () => {
      const expiredToken = createExpiredToken();
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(
          new Error('Firebase ID token has expired. Get a fresh ID token from your client.')
        );

      await expect(verifyToken(mockVerifyFn, 'expired-token')).rejects.toThrow(
        TokenVerificationError
      );

      try {
        await verifyToken(mockVerifyFn, 'expired-token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/id-token-expired');
      }
    });

    it('should_reject_malformed_token', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(
          new Error('Illegal argument provided to fromBase64Url().')
        );

      await expect(verifyToken(mockVerifyFn, 'malformed-token')).rejects.toThrow(
        TokenVerificationError
      );

      try {
        await verifyToken(mockVerifyFn, 'malformed-token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/invalid-token');
      }
    });

    it('should_reject_missing_token', async () => {
      const mockVerifyFn = vi.fn();

      await expect(verifyToken(mockVerifyFn, '')).rejects.toThrow(
        TokenVerificationError
      );

      try {
        await verifyToken(mockVerifyFn, '');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/invalid-token');
      }
    });

    it('should_reject_null_token', async () => {
      const mockVerifyFn = vi.fn();

      await expect(verifyToken(mockVerifyFn, null as any)).rejects.toThrow(
        TokenVerificationError
      );
    });

    it('should_reject_undefined_token', async () => {
      const mockVerifyFn = vi.fn();

      await expect(verifyToken(mockVerifyFn, undefined as any)).rejects.toThrow(
        TokenVerificationError
      );
    });

    it('should_reject_revoked_token', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(
          new Error('Firebase ID token has been revoked.')
        );

      await expect(verifyToken(mockVerifyFn, 'revoked-token')).rejects.toThrow(
        TokenVerificationError
      );

      try {
        await verifyToken(mockVerifyFn, 'revoked-token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/id-token-revoked');
      }
    });

    it('should_reject_token_with_invalid_signature', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(
          new Error('Firebase ID token signature verification failed.')
        );

      await expect(verifyToken(mockVerifyFn, 'invalid-signature')).rejects.toThrow(
        TokenVerificationError
      );

      try {
        await verifyToken(mockVerifyFn, 'invalid-signature');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/invalid-token-signature');
      }
    });
  });

  describe('Error Handling', () => {
    it('should_throw_token_verification_error', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Token verification failed'));

      try {
        await verifyToken(mockVerifyFn, 'token');
        expect.fail('Should have thrown error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(TokenVerificationError);
        expect((error as TokenVerificationError).name).toBe('TokenVerificationError');
      }
    });

    it('should_include_error_code_in_exception', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Firebase ID token has expired'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect(error).toHaveProperty('code');
        expect((error as TokenVerificationError).code).toBeTruthy();
      }
    });

    it('should_include_error_message_in_exception', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Firebase ID token has expired'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect(error).toHaveProperty('message');
        expect((error as TokenVerificationError).message).toContain('expired');
      }
    });
  });

  describe('Extract User ID from Token', () => {
    it('should_extract_uid_from_valid_token', () => {
      const validToken = createValidToken();
      const uid = extractUserIdFromToken(validToken);
      expect(uid).toBe('user-123');
    });

    it('should_extract_uid_from_specific_user_token', () => {
      const userToken = createTokenForUser('user-789');
      const uid = extractUserIdFromToken(userToken);
      expect(uid).toBe('user-789');
    });

    it('should_reject_token_without_uid', () => {
      const invalidToken = { iss: 'test' } as any;
      expect(() => extractUserIdFromToken(invalidToken)).toThrow(
        TokenVerificationError
      );
    });

    it('should_reject_null_token', () => {
      expect(() => extractUserIdFromToken(null as any)).toThrow(
        TokenVerificationError
      );
    });

    it('should_reject_undefined_token', () => {
      expect(() => extractUserIdFromToken(undefined as any)).toThrow(
        TokenVerificationError
      );
    });
  });

  describe('Token Expiration Check', () => {
    it('should_identify_expired_token', () => {
      const expiredToken = createExpiredToken();
      const isExpired = isTokenExpired(expiredToken);
      expect(isExpired).toBe(true);
    });

    it('should_identify_valid_token_as_not_expired', () => {
      const validToken = createValidToken();
      const isExpired = isTokenExpired(validToken);
      expect(isExpired).toBe(false);
    });

    it('should_return_true_for_token_without_exp', () => {
      const tokenWithoutExp = { uid: 'user-123' } as any;
      const isExpired = isTokenExpired(tokenWithoutExp);
      expect(isExpired).toBe(true);
    });

    it('should_handle_token_expiring_soon', () => {
      const now = Math.floor(Date.now() / 1000);
      const tokenExpiringIn1Second = createValidToken({
        exp: now + 1,
      });
      const isExpired = isTokenExpired(tokenExpiringIn1Second);
      expect(isExpired).toBe(false);
    });

    it('should_handle_token_just_expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const tokenJustExpired = createValidToken({
        exp: now - 1,
      });
      const isExpired = isTokenExpired(tokenJustExpired);
      expect(isExpired).toBe(true);
    });
  });

  describe('Error Code Mapping', () => {
    it('should_map_expired_error_to_correct_code', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Firebase ID token has expired'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/id-token-expired');
      }
    });

    it('should_map_revoked_error_to_correct_code', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Firebase ID token has been revoked'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/id-token-revoked');
      }
    });

    it('should_map_malformed_error_to_correct_code', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Illegal argument provided to fromBase64Url()'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/invalid-token');
      }
    });

    it('should_map_signature_error_to_correct_code', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Firebase ID token signature verification failed'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/invalid-token-signature');
      }
    });

    it('should_map_unknown_error_to_generic_code', async () => {
      const mockVerifyFn = vi
        .fn()
        .mockRejectedValue(new Error('Unknown error'));

      try {
        await verifyToken(mockVerifyFn, 'token');
      } catch (error: unknown) {
        expect((error as TokenVerificationError).code).toBe('auth/token-verification-failed');
      }
    });
  });

  describe('Integration with Fixtures', () => {
    it('should_verify_token_created_by_fixture', async () => {
      const validToken = createValidToken();
      const mockVerifyFn = vi.fn().mockResolvedValue(validToken);

      const result = await verifyToken(mockVerifyFn, 'token-string');

      expect(result.success).toBe(true);
      expect(result.uid).toBe(validToken.uid);
    });

    it('should_handle_multiple_user_tokens', async () => {
      const users = ['user-1', 'user-2', 'user-3'];

      for (const userId of users) {
        const userToken = createTokenForUser(userId);
        const mockVerifyFn = vi.fn().mockResolvedValue(userToken);

        const result = await verifyToken(mockVerifyFn, 'token');

        expect(result.uid).toBe(userId);
      }
    });
  });
});
