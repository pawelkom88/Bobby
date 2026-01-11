import { describe, it, expect } from 'vitest';
import {
  hashForRateLimit,
  isValidEmail,
  maskEmail,
} from '../../lib/email-utils';

describe('email-utils', () => {
  describe('isValidEmail', () => {
    it('accepts a well-formed email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('rejects non-string values and malformed emails', () => {
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing-domain@')).toBe(false);
    });

    it('rejects emails longer than 254 characters', () => {
      const longLocalPart = 'a'.repeat(245);
      const longEmail = `${longLocalPart}@example.com`;
      expect(longEmail.length).toBeGreaterThan(254);
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('maskEmail', () => {
    it('masks both local and domain parts for typical email', () => {
      expect(maskEmail('example.user@domain.com')).toBe('e*****r@d***n.com');
    });

    it('handles very short local or domain parts', () => {
      expect(maskEmail('ab@c')).toBe('**@***');
    });

    it('handles strings without domain separator', () => {
      expect(maskEmail('nodomain')).toBe('***@***');
    });
  });

  describe('hashForRateLimit', () => {
    it('produces deterministic hashes for the same input', async () => {
      const first = await hashForRateLimit('user@example.com');
      const second = await hashForRateLimit('user@example.com');

      expect(first).toEqual(second);
    });

    it('produces different hashes for different inputs with fixed length', async () => {
      const first = await hashForRateLimit('first@example.com');
      const second = await hashForRateLimit('second@example.com');

      expect(first).not.toEqual(second);
      expect(first).toHaveLength(24);
      expect(second).toHaveLength(24);
    });
  });
});
