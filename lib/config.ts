/**
 * Centralized configuration for Gemini + LemonFox integration
 * Easily adjustable for testing/production environments
 */

export const CONFIG = {
  // Session Duration
  SESSION_MAX_DURATION_SECONDS: 180, // 3 minutes

  // Gemini API Configuration
  GEMINI_MAX_OUTPUT_TOKENS: 150, // Tokens per response
  GEMINI_MODEL: 'gemini-2.5-flash', // Model to use

  // LemonFox TTS Configuration
  LEMONFOX_DEFAULT_VOICE: 'emma', // British female voice
  LEMONFOX_RESPONSE_FORMAT: 'mp3',
  LEMONFOX_SPEED: 1.0, // Range: 0.5 - 4.0
  LEMONFOX_LANGUAGE: 'en-gb', // British English

  // Rate Limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: 10,

  // API Endpoints
  GEMINI_API_ENDPOINT: '/api/gemini-chat',
  LEMONFOX_API_ENDPOINT: '/api/lemonfox-tts',

  // Age Tier to Prompt Mapping
  AGE_TIER_TO_PROMPT: {
    1: '4-6',
    2: '7-10',
    3: '11-13',
  } as const,
};

export type AgeTierForPrompt = keyof typeof CONFIG.AGE_TIER_TO_PROMPT;

/**
 * Get age tier label for Gemini prompt
 */
export function getAgeTierLabel(tierId: 1 | 2 | 3): string {
  return CONFIG.AGE_TIER_TO_PROMPT[tierId];
}
