import type { DialStoryContext } from '@/lib/dialStoryContext';
import type { JourneyState } from '@/types';

export const getStorySummaryFromJourney = (
  journeyState?: JourneyState
): DialStoryContext | null => {
  if (!journeyState) return null;

  const { selectedAgeTier, selectedService } = journeyState;
  if (!selectedAgeTier && !selectedService) return null;

  return {
    ageTier: selectedAgeTier,
    service: selectedService,
  };
};

export const hasStorySelection = (
  storySummary: DialStoryContext | null
): boolean =>
  !!storySummary &&
  (storySummary.ageTier !== undefined || storySummary.service !== undefined);
