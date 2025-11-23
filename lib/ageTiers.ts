/**
 * Age tier configuration for different age groups
 */

import type { AgeTierConfig, AgeTier } from '@/types';

export const AGE_TIERS = {
  TIER_1: {
    id: 1 as AgeTier,
    label: 'Ages 4-6',
    minAge: 4,
    maxAge: 6,
    description: 'Extremely simple language, very short scenarios, more pictograms',
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
    description: 'Near-realistic operator flow, introduce 111 vs 999 difference',
  },
} as const;

/**
 * Get age tier by ID
 */
// export function getAgeTier(tierId: AgeTier): AgeTierConfig {
//   const tiers = Object.values(AGE_TIERS);
//   return tiers.find(tier => tier.id === tierId) || AGE_TIERS.TIER_1;
// }

/**
 * Get all age tiers
 */
export function getAllAgeTiers(): AgeTierConfig[] {
  return Object.values(AGE_TIERS);
}

/**
 * Get language complexity settings for a tier
 */
// export function getLanguageSettings(tierId: AgeTier) {
//   const tier = getAgeTier(tierId);
//
//   switch (tier.id) {
//     case 1:
//       return {
//         useSimpleWords: true,
//         shortSentences: true,
//         usePictograms: true,
//         repetition: true,
//         encouragementFrequency: 'high' as const,
//       };
//     case 2:
//       return {
//         useSimpleWords: true,
//         shortSentences: false,
//         usePictograms: true,
//         repetition: false,
//         encouragementFrequency: 'medium' as const,
//       };
//     case 3:
//       return {
//         useSimpleWords: false,
//         shortSentences: false,
//         usePictograms: false,
//         repetition: false,
//         encouragementFrequency: 'low' as const,
//         introduce111: true,
//       };
//     default:
//       return getLanguageSettings(1);
//   }
// }

/**
 * Get scenario variations for a tier
 */
// export function getScenarioSettings(tierId: AgeTier) {
//   const tier = getAgeTier(tierId);
//
//   switch (tier.id) {
//     case 1:
//       return {
//         duration: 'short' as const,
//         complexity: 'low' as const,
//         visualAids: true,
//         stepByStep: true,
//       };
//     case 2:
//       return {
//         duration: 'medium' as const,
//         complexity: 'medium' as const,
//         visualAids: true,
//         stepByStep: false,
//       };
//     case 3:
//       return {
//         duration: 'long' as const,
//         complexity: 'high' as const,
//         visualAids: false,
//         stepByStep: false,
//       };
//     default:
//       return getScenarioSettings(1);
//   }
// }

