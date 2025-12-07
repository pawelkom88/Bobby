/**
 * Validation Tests
 * Tests for input validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateAgeTier,
  validateService,
  validateXP,
  validateTimestamp,
  sanitizeText,
  validateEmergencyNumber,
  validatePassword,
  getPasswordRequirements,
  validateEmail,
} from '@/lib/validation';

describe('Validation Utilities', () => {
  describe('validateAgeTier', () => {
    it('should return true for valid age tier 1', () => {
      expect(validateAgeTier(1)).toBe(true);
    });

    it('should return true for valid age tier 2', () => {
      expect(validateAgeTier(2)).toBe(true);
    });

    it('should return true for valid age tier 3', () => {
      expect(validateAgeTier(3)).toBe(true);
    });

    it('should return false for age tier 0', () => {
      expect(validateAgeTier(0)).toBe(false);
    });

    it('should return false for age tier 4', () => {
      expect(validateAgeTier(4)).toBe(false);
    });

    it('should return false for string input', () => {
      expect(validateAgeTier('1')).toBe(false);
    });

    it('should return false for null', () => {
      expect(validateAgeTier(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(validateAgeTier(undefined)).toBe(false);
    });
  });

  describe('validateService', () => {
    it('should return true for fire service', () => {
      expect(validateService('fire')).toBe(true);
    });

    it('should return true for ambulance service', () => {
      expect(validateService('ambulance')).toBe(true);
    });

    it('should return true for police service', () => {
      expect(validateService('police')).toBe(true);
    });

    it('should return false for invalid service', () => {
      expect(validateService('hospital')).toBe(false);
    });

    it('should return false for number input', () => {
      expect(validateService(999)).toBe(false);
    });

    it('should return false for null', () => {
      expect(validateService(null)).toBe(false);
    });

    it('should return false for uppercase service', () => {
      expect(validateService('FIRE')).toBe(false);
    });
  });

  describe('validateXP', () => {
    it('should return true for XP of 0', () => {
      expect(validateXP(0)).toBe(true);
    });

    it('should return true for XP of 50', () => {
      expect(validateXP(50)).toBe(true);
    });

    it('should return true for XP of 100', () => {
      expect(validateXP(100)).toBe(true);
    });

    it('should return false for negative XP', () => {
      expect(validateXP(-1)).toBe(false);
    });

    it('should return false for XP over 100', () => {
      expect(validateXP(101)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(validateXP(NaN)).toBe(false);
    });

    it('should return false for string input', () => {
      expect(validateXP('50')).toBe(false);
    });
  });

  describe('validateTimestamp', () => {
    it('should return true for valid ISO timestamp', () => {
      expect(validateTimestamp('2024-01-01T10:00:00.000Z')).toBe(true);
    });

    it('should return true for valid date string', () => {
      expect(validateTimestamp('2024-01-01')).toBe(true);
    });

    it('should return false for invalid date string', () => {
      expect(validateTimestamp('not-a-date')).toBe(false);
    });

    it('should return false for number input', () => {
      expect(validateTimestamp(1704067200000)).toBe(false);
    });

    it('should return false for null', () => {
      expect(validateTimestamp(null)).toBe(false);
    });
  });

  describe('sanitizeText', () => {
    it('should trim whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('should limit text to 1000 characters', () => {
      const longText = 'a'.repeat(1500);
      expect(sanitizeText(longText).length).toBe(1000);
    });

    it('should preserve text under 1000 characters', () => {
      const text = 'Hello, world!';
      expect(sanitizeText(text)).toBe(text);
    });

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('validateEmergencyNumber', () => {
    it('should return true for correct emergency number 999', () => {
      expect(validateEmergencyNumber('999')).toBe(true);
    });

    it('should return false for incorrect number', () => {
      expect(validateEmergencyNumber('911')).toBe(false);
    });

    it('should accept custom target number', () => {
      expect(validateEmergencyNumber('111', '111')).toBe(true);
    });

    it('should return false for partial match', () => {
      expect(validateEmergencyNumber('99')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept a strong password', () => {
      const result = validatePassword('MyStr0ng!Pass');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePassword('mystr0ng!pass');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePassword('MYSTR0NG!PASS');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('MyStrong!Pass');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePassword('MyStr0ngPass');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    });

    it('should reject common passwords', () => {
      // Password123 is in the common passwords list (without special char)
      const result = validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('This password is too common. Please choose a more unique password');
    });

    it('should reject passwords with repeated characters', () => {
      const result = validatePassword('Aaaa1234!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password should not contain more than 2 repeated characters in a row');
    });

    it('should return weak strength for poor passwords', () => {
      const result = validatePassword('abc');
      expect(result.strength).toBe('weak');
    });

    it('should return strong strength for excellent passwords', () => {
      const result = validatePassword('MyV3ryStr0ng!P@ssword');
      expect(result.strength).toBe('strong');
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return array of requirements', () => {
      const requirements = getPasswordRequirements();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should include length requirement', () => {
      const requirements = getPasswordRequirements();
      expect(requirements.some(r => r.includes('8 characters'))).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('test@mail.example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject email without @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });

    it('should reject email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
    });

    it('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject whitespace only', () => {
      const result = validateEmail('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email longer than 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email address is too long');
    });

    it('should reject null input', () => {
      const result = validateEmail(null as any);
      expect(result.valid).toBe(false);
    });
  });
});

