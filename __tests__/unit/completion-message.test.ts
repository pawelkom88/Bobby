/**
 * CompletionMessage Helper Tests
 * Tests for completion screen helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  getCompletionTitle,
  getPerformanceImage,
} from '../../components/CompletionMessage';

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'title.trainingComplete': '🎉 Training Complete! 🎉',
    'title.practiceComplete': 'Practice Session Complete',
    'title.wellDone': 'Well Done! 🎉',
    'performance.flawless': 'Flawless performance!',
    'performance.wellDone': 'Well done!',
    'performance.keepPracticing': "Don't worry, keep practicing!",
  };
  return translations[key] || key;
};

describe('CompletionMessage Helpers', () => {
  describe('getCompletionTitle', () => {
    it('should return training complete title for level 10', () => {
      const title = getCompletionTitle(true, 100, mockT);
      expect(title).toBe('🎉 Training Complete! 🎉');
    });

    it('should return training complete title for level 10 even with 0 XP', () => {
      const title = getCompletionTitle(true, 0, mockT);
      expect(title).toBe('🎉 Training Complete! 🎉');
    });

    it('should return practice session title for 0 XP earned', () => {
      const title = getCompletionTitle(false, 0, mockT);
      expect(title).toBe('Practice Session Complete');
    });

    it('should return well done title for positive XP earned', () => {
      const title = getCompletionTitle(false, 50, mockT);
      expect(title).toBe('Well Done! 🎉');
    });

    it('should return well done title for 100 XP earned', () => {
      const title = getCompletionTitle(false, 100, mockT);
      expect(title).toBe('Well Done! 🎉');
    });

    it('should prioritize level 10 over XP amount', () => {
      // Even with 0 XP, level 10 should show training complete
      const title = getCompletionTitle(true, 0, mockT);
      expect(title).toBe('🎉 Training Complete! 🎉');
    });
  });

  describe('getPerformanceImage', () => {
    it('should return flawless image for score >= 90', () => {
      const result = getPerformanceImage(90, mockT);
      expect(result.src).toBe('/flawless.png');
      expect(result.alt).toBe('Flawless performance!');
    });

    it('should return flawless image for score of 100', () => {
      const result = getPerformanceImage(100, mockT);
      expect(result.src).toBe('/flawless.png');
      expect(result.alt).toBe('Flawless performance!');
    });

    it('should return flawless image for score of 95', () => {
      const result = getPerformanceImage(95, mockT);
      expect(result.src).toBe('/flawless.png');
    });

    it('should return welldone image for score >= 60 and < 90', () => {
      const result = getPerformanceImage(60, mockT);
      expect(result.src).toBe('/welldone.png');
      expect(result.alt).toBe('Well done!');
    });

    it('should return welldone image for score of 89', () => {
      const result = getPerformanceImage(89, mockT);
      expect(result.src).toBe('/welldone.png');
    });

    it('should return welldone image for score of 75', () => {
      const result = getPerformanceImage(75, mockT);
      expect(result.src).toBe('/welldone.png');
    });

    it('should return donotworry image for score < 60', () => {
      const result = getPerformanceImage(59, mockT);
      expect(result.src).toBe('/donotworry.png');
      expect(result.alt).toBe("Don't worry, keep practicing!");
    });

    it('should return donotworry image for score of 0', () => {
      const result = getPerformanceImage(0, mockT);
      expect(result.src).toBe('/donotworry.png');
    });

    it('should return donotworry image for score of 30', () => {
      const result = getPerformanceImage(30, mockT);
      expect(result.src).toBe('/donotworry.png');
    });

    it('should handle boundary values correctly', () => {
      // Test exact boundaries
      expect(getPerformanceImage(90, mockT).src).toBe('/flawless.png');
      expect(getPerformanceImage(89, mockT).src).toBe('/welldone.png');
      expect(getPerformanceImage(60, mockT).src).toBe('/welldone.png');
      expect(getPerformanceImage(59, mockT).src).toBe('/donotworry.png');
    });

    it('should handle negative scores', () => {
      const result = getPerformanceImage(-10, mockT);
      expect(result.src).toBe('/donotworry.png');
    });

    it('should handle scores above 100', () => {
      const result = getPerformanceImage(110, mockT);
      expect(result.src).toBe('/flawless.png');
    });
  });
});
