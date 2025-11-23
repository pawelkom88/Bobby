/**
 * Centralized configuration
 */

export const CONFIG = {
  // Session Duration
  SESSION_MAX_DURATION_SECONDS: 180, // 3 minutes

  // Conversation Duration for Emergency Scenarios
  MAX_CONVERSATION_TIME_MINUTES: 5,

  // Deepgram Configuration
  DEEPGRAM_API_ENDPOINT: '/api/authenticate',
  
  // Agent Models
  AGENT_LISTEN_MODEL: 'nova-2',
  AGENT_THINK_PROVIDER: 'open_ai',
  AGENT_THINK_MODEL: 'gpt-4o-mini',
  AGENT_SPEAK_MODEL: 'aura-asteria-en',

  // Age Tier to Prompt Mapping
  AGE_TIER_TO_PROMPT: {
    1: '5-7',
    2: '8-10',
    3: '11-12',
  } as const,
};

export type AgeTierForPrompt = keyof typeof CONFIG.AGE_TIER_TO_PROMPT;

/**
 * Get age tier label
 */
export function getAgeTierLabel(tierId: 1 | 2 | 3): string {
  return CONFIG.AGE_TIER_TO_PROMPT[tierId];
}
