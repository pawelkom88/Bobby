// lib/prompts/index.ts
// Locale-aware prompt exports

import {
  getAmbulancePrompt as getAmbulancePromptEN,
  getFirePrompt as getFirePromptEN,
  getPolicePrompt as getPolicePromptEN,
} from './prompts';

import {
  getAmbulancePromptPL,
  getFirePromptPL,
  getPolicePromptPL,
} from './prompts-pl';

export type AgeTier = '5–7 years old' | '8–10 years old' | '11–12 years old';
export type Locale = 'en' | 'pl';

export function getAmbulancePrompt(
  ageTier: AgeTier,
  maxConversationTime: number,
  locale: Locale = 'en'
): string {
  if (locale === 'pl') {
    return getAmbulancePromptPL(ageTier, maxConversationTime);
  }
  return getAmbulancePromptEN(ageTier, maxConversationTime);
}

export function getFirePrompt(
  ageTier: AgeTier,
  maxConversationTime: number,
  locale: Locale = 'en'
): string {
  if (locale === 'pl') {
    return getFirePromptPL(ageTier, maxConversationTime);
  }
  return getFirePromptEN(ageTier, maxConversationTime);
}

export function getPolicePrompt(
  ageTier: AgeTier,
  maxConversationTime: number,
  locale: Locale = 'en'
): string {
  if (locale === 'pl') {
    return getPolicePromptPL(ageTier, maxConversationTime);
  }
  return getPolicePromptEN(ageTier, maxConversationTime);
}

export function getPromptByService(
  service: 'ambulance' | 'fire' | 'police',
  ageTier: AgeTier,
  maxConversationTime: number,
  locale: Locale = 'en'
): string {
  switch (service) {
    case 'ambulance':
      return getAmbulancePrompt(ageTier, maxConversationTime, locale);
    case 'fire':
      return getFirePrompt(ageTier, maxConversationTime, locale);
    case 'police':
      return getPolicePrompt(ageTier, maxConversationTime, locale);
  }
}
