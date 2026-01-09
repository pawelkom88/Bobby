/**
 * Input validation utilities
 *
 * Security: CWE-521 - Strong password requirements
 */

import type { AgeTier, Service } from '@/types';

/**
 * Validate age tier
 */
export function validateAgeTier(tier: unknown): tier is AgeTier {
  return typeof tier === 'number' && (tier === 1 || tier === 2 || tier === 3);
}

/**
 * Validate service type
 */
export function validateService(service: unknown): service is Service {
  return (
    typeof service === 'string' &&
    (service === 'fire' || service === 'ambulance' || service === 'police')
  );
}

/**
 * Validate XP amount
 */
export function validateXP(xp: unknown): xp is number {
  return typeof xp === 'number' && xp >= 0 && xp <= 100 && !isNaN(xp);
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: unknown): timestamp is string {
  if (typeof timestamp !== 'string') {
    return false;
  }
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Sanitize user input text
 */
export function sanitizeText(text: string): string {
  return text.trim().slice(0, 1000); // Limit to 1000 characters
}

/**
 * Valid emergency numbers by locale
 * UK accepts both 999 and 112 (EU standard)
 * Poland uses 112
 */
const VALID_EMERGENCY_NUMBERS: Record<string, string[]> = {
  '999': ['999', '112'],  // UK - accepts both 999 and 112
  '112': ['112'],         // EU/Poland - only 112
};

/**
 * Validate emergency number input (exact match)
 * @deprecated Use isValidEmergencyNumber for more flexible validation
 */
export function validateEmergencyNumber(
  input: string,
  targetNumber: string = '999'
): boolean {
  return input === targetNumber;
}

/**
 * Check if input is a valid emergency number
 * Supports multiple valid numbers per locale (e.g., UK accepts 999 and 112)
 * Also handles cases where user types extra digits (e.g., 9999 still connects to 999)
 */
export function isValidEmergencyNumber(
  input: string,
  targetNumber: string = '999'
): boolean {
  const validNumbers = VALID_EMERGENCY_NUMBERS[targetNumber] || [targetNumber];

  // Check if input exactly matches any valid number
  if (validNumbers.includes(input)) {
    return true;
  }

  // Check if input starts with a valid number followed by same digit
  // e.g., 9999 or 99999 should still work for 999
  for (const validNum of validNumbers) {
    if (input.startsWith(validNum)) {
      // Check if remaining digits are all the same as the last digit of the valid number
      const remaining = input.slice(validNum.length);
      const lastDigit = validNum[validNum.length - 1];
      if (remaining.split('').every(d => d === lastDigit)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Validate password strength
 *
 * Security: CWE-521 - Enforces strong password requirements
 *
 * Requirements:
 * - Minimum 8 characters (NIST recommends 8+, we use 8 as minimum)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not a commonly used password
 *
 * @param password - The password to validate
 * @returns Validation result with errors and strength indicator
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  // Check minimum length (8 characters - NIST minimum recommendation)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    strengthScore += 1;
    if (password.length >= 12) strengthScore += 1;
    if (password.length >= 16) strengthScore += 1;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    strengthScore += 1;
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    strengthScore += 1;
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    strengthScore += 1;
  }

  // Check for special character
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  } else {
    strengthScore += 1;
  }

  // Check against common passwords
  const commonPasswords = [
    'password', 'password1', 'password123', '12345678', '123456789',
    'qwerty123', 'letmein', 'welcome', 'admin123', 'iloveyou',
    'sunshine', 'princess', 'football', 'baseball', 'dragon',
    'master', 'monkey', 'shadow', 'ashley', 'michael',
    'Password1', 'Password123', 'Qwerty123', 'Welcome1',
  ];

  if (commonPasswords.some(common =>
    password.toLowerCase() === common.toLowerCase()
  )) {
    errors.push('This password is too common. Please choose a more unique password');
    strengthScore = Math.max(0, strengthScore - 2);
  }

  // Check for sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain more than 2 repeated characters in a row');
    strengthScore = Math.max(0, strengthScore - 1);
  }

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (strengthScore <= 2) {
    strength = 'weak';
  } else if (strengthScore <= 4) {
    strength = 'fair';
  } else if (strengthScore <= 6) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Get password requirements as a human-readable list
 */
export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*)',
  ];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Additional checks
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  return { valid: true };
}
