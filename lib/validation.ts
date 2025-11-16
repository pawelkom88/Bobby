/**
 * Input validation utilities
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
 * Validate emergency number input
 */
export function validateEmergencyNumber(input: string, targetNumber: string = '999'): boolean {
  return input === targetNumber;
}

