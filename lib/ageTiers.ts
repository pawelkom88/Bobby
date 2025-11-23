import type { AgeTierConfig, AgeTier } from '@/types';

export const AGE_TIERS = {
  TIER_1: {
    id: 1 as AgeTier,
    label: 'Ages 4-6',
    minAge: 4,
    maxAge: 6,
    description:
      'Extremely simple language, very short scenarios, more pictograms',
  },
  TIER_2: {
    id: 2 as AgeTier,
    label: 'Ages 7-10',
    minAge: 7,
    maxAge: 10,
    description: 'More realistic conversation, full-sentence encouragement',
  },
  TIER_3: {
    id: 3 as AgeTier,
    label: 'Ages 11-13',
    minAge: 11,
    maxAge: 13,
    description:
      'Near-realistic operator flow, introduce 111 vs 999 difference',
  },
} as const;

export function getAllAgeTiers(): AgeTierConfig[] {
  return Object.values(AGE_TIERS);
}
