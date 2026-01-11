import { describe, expect, it } from 'vitest';
import {
  getStorySummaryFromJourney,
  hasStorySelection,
} from '../../utils/select-package';

describe('getStorySummaryFromJourney', () => {
  it('returns null when journey state is missing', () => {
    expect(getStorySummaryFromJourney()).toBeNull();
  });

  it('returns null when journey state has no selections', () => {
    expect(getStorySummaryFromJourney({})).toBeNull();
  });

  it('maps selected age tier into story summary', () => {
    expect(getStorySummaryFromJourney({ selectedAgeTier: 2 })).toEqual({
      ageTier: 2,
      service: undefined,
    });
  });

  it('maps selected service into story summary', () => {
    expect(getStorySummaryFromJourney({ selectedService: 'fire' })).toEqual({
      ageTier: undefined,
      service: 'fire',
    });
  });
});

describe('hasStorySelection', () => {
  it('returns false for empty or null summaries', () => {
    expect(hasStorySelection(null)).toBe(false);
    expect(hasStorySelection({})).toBe(false);
  });

  it('returns true when age tier or service is set', () => {
    expect(hasStorySelection({ ageTier: 1 })).toBe(true);
    expect(hasStorySelection({ service: 'ambulance' })).toBe(true);
  });
});
