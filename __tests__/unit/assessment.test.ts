/**
 * Assessment Tests
 * Tests for conversation assessment and scoring logic
 */

import { describe, it, expect, vi } from 'vitest';
import { scoreToXP } from '@/lib/assessment';

// Mock logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Assessment', () => {
  describe('scoreToXP', () => {
    it('should return 100 XP for score >= 90', () => {
      expect(scoreToXP(90)).toBe(100);
      expect(scoreToXP(95)).toBe(100);
      expect(scoreToXP(100)).toBe(100);
    });

    it('should return 85 XP for score >= 80 and < 90', () => {
      expect(scoreToXP(80)).toBe(85);
      expect(scoreToXP(85)).toBe(85);
      expect(scoreToXP(89)).toBe(85);
    });

    it('should return 75 XP for score >= 70 and < 80', () => {
      expect(scoreToXP(70)).toBe(75);
      expect(scoreToXP(75)).toBe(75);
      expect(scoreToXP(79)).toBe(75);
    });

    it('should return 60 XP for score >= 60 and < 70', () => {
      expect(scoreToXP(60)).toBe(60);
      expect(scoreToXP(65)).toBe(60);
      expect(scoreToXP(69)).toBe(60);
    });

    it('should return 45 XP for score >= 45 and < 60', () => {
      expect(scoreToXP(45)).toBe(45);
      expect(scoreToXP(50)).toBe(45);
      expect(scoreToXP(59)).toBe(45);
    });

    it('should return 25 XP for score >= 30 and < 45', () => {
      expect(scoreToXP(30)).toBe(25);
      expect(scoreToXP(35)).toBe(25);
      expect(scoreToXP(44)).toBe(25);
    });

    it('should return 10 XP for score >= 15 and < 30', () => {
      expect(scoreToXP(15)).toBe(10);
      expect(scoreToXP(20)).toBe(10);
      expect(scoreToXP(29)).toBe(10);
    });

    it('should return 0 XP for score < 15', () => {
      expect(scoreToXP(14)).toBe(0);
      expect(scoreToXP(10)).toBe(0);
      expect(scoreToXP(0)).toBe(0);
    });

    it('should handle boundary values correctly', () => {
      // Test exact boundaries
      expect(scoreToXP(90)).toBe(100);
      expect(scoreToXP(89)).toBe(85);
      expect(scoreToXP(80)).toBe(85);
      expect(scoreToXP(79)).toBe(75);
      expect(scoreToXP(70)).toBe(75);
      expect(scoreToXP(69)).toBe(60);
      expect(scoreToXP(60)).toBe(60);
      expect(scoreToXP(59)).toBe(45);
      expect(scoreToXP(45)).toBe(45);
      expect(scoreToXP(44)).toBe(25);
      expect(scoreToXP(30)).toBe(25);
      expect(scoreToXP(29)).toBe(10);
      expect(scoreToXP(15)).toBe(10);
      expect(scoreToXP(14)).toBe(0);
    });

    it('should handle negative scores', () => {
      expect(scoreToXP(-10)).toBe(0);
    });

    it('should handle scores above 100', () => {
      // Scores above 100 should still return max XP
      expect(scoreToXP(110)).toBe(100);
    });
  });
});

