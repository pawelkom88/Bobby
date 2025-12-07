/**
 * Gamification Tests
 * Tests for XP, level, and badge calculation logic
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateLevel,
  getXPForNextLevel,
  getXPToNextLevel,
  getBadgeForLevel,
  getBadgeForFirstCall,
  getBadgeForScenario,
  getBadgeForScore,
  getBadgeForScenariosExplored,
  LEVEL_REQUIREMENTS,
  BADGES,
} from '@/lib/gamification';

// Mock logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Gamification', () => {
  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for 99 XP', () => {
      expect(calculateLevel(99)).toBe(1);
    });

    it('should return level 2 for 100 XP', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it('should return level 3 for 250 XP', () => {
      expect(calculateLevel(250)).toBe(3);
    });

    it('should return level 10 for 2700 XP', () => {
      expect(calculateLevel(2700)).toBe(10);
    });

    it('should return level 10 for XP above max', () => {
      expect(calculateLevel(5000)).toBe(10);
    });

    it('should handle negative XP by returning level 1', () => {
      expect(calculateLevel(-100)).toBe(1);
    });

    it('should correctly calculate level at each boundary', () => {
      // Test each level boundary
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(250)).toBe(3);
      expect(calculateLevel(450)).toBe(4);
      expect(calculateLevel(700)).toBe(5);
      expect(calculateLevel(1000)).toBe(6);
      expect(calculateLevel(1350)).toBe(7);
      expect(calculateLevel(1750)).toBe(8);
      expect(calculateLevel(2200)).toBe(9);
      expect(calculateLevel(2700)).toBe(10);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return 100 XP for level 1', () => {
      expect(getXPForNextLevel(1)).toBe(100);
    });

    it('should return 250 XP for level 2', () => {
      expect(getXPForNextLevel(2)).toBe(250);
    });

    it('should return 0 for max level (10)', () => {
      expect(getXPForNextLevel(10)).toBe(0);
    });

    it('should return 0 for level above max', () => {
      expect(getXPForNextLevel(11)).toBe(0);
    });
  });

  describe('getXPToNextLevel', () => {
    it('should return 100 XP needed from 0 XP', () => {
      expect(getXPToNextLevel(0)).toBe(100);
    });

    it('should return 50 XP needed from 50 XP', () => {
      expect(getXPToNextLevel(50)).toBe(50);
    });

    it('should return 150 XP needed from 100 XP (level 2)', () => {
      // At 100 XP, you're level 2, next level is 250
      expect(getXPToNextLevel(100)).toBe(150);
    });

    it('should return 0 at max level', () => {
      expect(getXPToNextLevel(2700)).toBe(0);
    });

    it('should return 0 above max level', () => {
      expect(getXPToNextLevel(5000)).toBe(0);
    });
  });

  describe('getBadgeForLevel', () => {
    it('should return BRAVE_HELPER badge for level 6', () => {
      const badge = getBadgeForLevel(6);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('brave-helper');
    });

    it('should return SCENARIO_EXPLORER badge for level 9', () => {
      const badge = getBadgeForLevel(9);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('scenario_explorer');
    });

    it('should return null for non-milestone levels', () => {
      expect(getBadgeForLevel(1)).toBeNull();
      expect(getBadgeForLevel(2)).toBeNull();
      expect(getBadgeForLevel(5)).toBeNull();
      expect(getBadgeForLevel(10)).toBeNull();
    });
  });

  describe('getBadgeForFirstCall', () => {
    it('should return FIRST_CALL_HERO badge', () => {
      const badge = getBadgeForFirstCall();
      expect(badge.id).toBe('first-call-hero');
      expect(badge.name).toBe('First Call Hero');
    });
  });

  describe('getBadgeForScenario', () => {
    it('should return BRAVE_HELPER for police scenario', () => {
      const badge = getBadgeForScenario('police');
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('brave-helper');
    });

    it('should return BRAVE_HELPER for fire scenario', () => {
      const badge = getBadgeForScenario('fire');
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('brave-helper');
    });

    it('should return null for ambulance scenario', () => {
      expect(getBadgeForScenario('ambulance')).toBeNull();
    });

    it('should return null for unknown scenario', () => {
      expect(getBadgeForScenario('unknown')).toBeNull();
    });
  });

  describe('getBadgeForScore', () => {
    it('should return CALM_COMMUNICATOR for score >= 90', () => {
      const badge = getBadgeForScore(90);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('calm-communicator');
    });

    it('should return CALM_COMMUNICATOR for score of 100', () => {
      const badge = getBadgeForScore(100);
      expect(badge?.id).toBe('calm-communicator');
    });

    it('should return LISTENING_MASTER for score >= 80 and < 90', () => {
      const badge = getBadgeForScore(80);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('listening_master');
    });

    it('should return LISTENING_MASTER for score of 89', () => {
      const badge = getBadgeForScore(89);
      expect(badge?.id).toBe('listening_master');
    });

    it('should return BRAVE_HELPER for score >= 70 and < 80', () => {
      const badge = getBadgeForScore(70);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('brave-helper');
    });

    it('should return BRAVE_HELPER for score of 79', () => {
      const badge = getBadgeForScore(79);
      expect(badge?.id).toBe('brave-helper');
    });

    it('should return null for score < 70', () => {
      expect(getBadgeForScore(69)).toBeNull();
      expect(getBadgeForScore(50)).toBeNull();
      expect(getBadgeForScore(0)).toBeNull();
    });
  });

  describe('getBadgeForScenariosExplored', () => {
    it('should return SCENARIO_EXPLORER for 3 scenarios', () => {
      const badge = getBadgeForScenariosExplored(3);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('scenario_explorer');
    });

    it('should return SCENARIO_EXPLORER for more than 3 scenarios', () => {
      const badge = getBadgeForScenariosExplored(5);
      expect(badge).not.toBeNull();
      expect(badge?.id).toBe('scenario_explorer');
    });

    it('should return null for less than 3 scenarios', () => {
      expect(getBadgeForScenariosExplored(2)).toBeNull();
      expect(getBadgeForScenariosExplored(1)).toBeNull();
      expect(getBadgeForScenariosExplored(0)).toBeNull();
    });
  });

  describe('LEVEL_REQUIREMENTS constant', () => {
    it('should have 10 levels', () => {
      expect(LEVEL_REQUIREMENTS.length).toBe(10);
    });

    it('should start at 0 XP for level 1', () => {
      expect(LEVEL_REQUIREMENTS[0]).toBe(0);
    });

    it('should be in ascending order', () => {
      for (let i = 1; i < LEVEL_REQUIREMENTS.length; i++) {
        expect(LEVEL_REQUIREMENTS[i]).toBeGreaterThan(LEVEL_REQUIREMENTS[i - 1]);
      }
    });
  });

  describe('BADGES constant', () => {
    it('should have all required badges', () => {
      expect(BADGES.FIRST_CALL_HERO).toBeDefined();
      expect(BADGES.BRAVE_HELPER).toBeDefined();
      expect(BADGES.CALM_COMMUNICATOR).toBeDefined();
      expect(BADGES.LISTENING_MASTER).toBeDefined();
      expect(BADGES.SCENARIO_EXPLORER).toBeDefined();
    });

    it('should have valid badge structure', () => {
      Object.values(BADGES).forEach(badge => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('image');
        expect(badge).toHaveProperty('description');
      });
    });
  });
});

