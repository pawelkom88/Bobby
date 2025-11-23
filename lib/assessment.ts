import type { AgeTier, Service, ConversationMessage } from '@/types';

export interface ConversationAssessment {
  score: number;
  passed: boolean;
  positives: string[];
  improvements: string[];
  warnings: string[];
  metrics: {
    userTurns: number;
    durationSeconds: number;
  };
}

type AssessmentOptions = {
  ageTier?: AgeTier | null;
  situation?: Service | null;
};

const EMERGENCY_KEYWORDS: Record<Service, string[]> = {
  fire: [
    'fire',
    'smoke',
    'burn',
    'burning',
    'flames',
    'hot',
    'kitchen',
    'house on fire',
    'blaze',
    'combustion',
  ],
  ambulance: [
    'ambulance',
    'hurt',
    'injured',
    'bleeding',
    'not breathing',
    'passed out',
    'sick',
    'medical',
    'pain',
    'hurt',
    'accident',
    'twisted',
    'broken',
    'fracture',
    'sprain',
    'wound',
    'emergency',
    'help',
    'ill',
    'illness',
    'injury',
    'injure',
    'emergency',
    'problem',
    'issue',
    'fell',
    'fall',
    'cut',
    'bruise',
    'emergency',
    'please',
    'need help',
    'urgent',
  ],
  police: [
    'police',
    'intruder',
    'break in',
    'stole',
    'stealing',
    'kidnap',
    'danger',
    'fight',
    'crime',
    'help',
    'emergency',
  ],
};

const LOCATION_KEYWORDS = [
  'home',
  'house',
  'apartment',
  'school',
  'park',
  'street',
  'road',
  'drive',
  'avenue',
  'mall',
  'store',
  'room',
  'floor',
  'kitchen',
  'bathroom',
];

const PEOPLE_KEYWORDS = [
  'mom',
  'mum',
  'dad',
  'brother',
  'sister',
  'friend',
  'teacher',
  'baby',
  'pet',
  'grandma',
  'grandpa',
  'someone',
  'person',
  'people',
];

const CONDITION_KEYWORDS = [
  'bleeding',
  'not breathing',
  'unconscious',
  'awake',
  'hurt',
  'injured',
  'stuck',
  'trapped',
  'burned',
  'crying',
  'collapsed',
  'fainted',
  'seizure',
  'twisted',
  'broken',
  'fracture',
  'sprain',
  'pain',
  'aching',
  'bruise',
  'bruised',
  'swollen',
  'limp',
  'wound',
  'cut',
  'bleeding',
  'unconscious',
  'choking',
  'suffocating',
  'drowning',
];

const FIRE_CONDITION_KEYWORDS = [
  'trapped',
  'stuck',
  'inside',
  'outside',
  'out',
  'safe',
  'burning',
  'smoke',
  'flames',
  'huge',
  'big',
  'small',
  'spreading',
  'smell',
];

const POLICE_CONDITION_KEYWORDS = [
  'hiding',
  'hid',
  'safe',
  'locked',
  'door',
  'window',
  'scared',
  'run',
  'running',
  'away',
  'weapon',
  'gun',
  'knife',
  'break',
  'breaking',
];

const IRRELEVANT_KEYWORDS = [
  'pizza',
  'order food',
  'hamburger',
  'prank',
  'joke',
  'test',
  'gaming',
  'play',
  'nothing',
  'random',
  'hello?',
];

const MIN_TURNS_BY_TIER: Record<AgeTier, number> = {
  1: 2,
  2: 3,
  3: 4,
};

const PASS_THRESHOLD_BY_TIER: Record<AgeTier, number> = {
  1: 50,
  2: 60,
  3: 70,
};

// Minimum conversation duration in seconds
const MIN_DURATION_SECONDS = 30;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword));
}

function detectAddressLike(text: string): boolean {
  return /\b\d{1,4}\s+(street|st|road|rd|avenue|ave|drive|dr|lane|ln|court|ct)\b/.test(
    text
  );
}

function calculateDurationSeconds(messages: ConversationMessage[]): number {
  const timestamps = messages
    .map(msg => Date.parse(msg.timestamp))
    .filter(value => !Number.isNaN(value));
  if (timestamps.length < 2) {
    return 0;
  }
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);
  return Math.max(0, Math.round((max - min) / 1000));
}

function mapScoreToFeedback(
  score: number,
  positives: string[],
  improvements: string[],
  warnings: string[]
) {
  if (score >= 85 && positives.length === 0) {
    positives.push('You shared everything Bobby needed!');
  }
  if (score < 60 && improvements.length === 0) {
    improvements.push('Remember to say what happened and where you are.');
  }
  if (warnings.length === 0 && score < 30) {
    warnings.push('It sounded like you were unsure. Try to stay on topic.');
  }
}

/**
 * Assess conversation using rule-based heuristics (Deepgram migration)
 *
 * Previously used Gemini AI, now falls back to local assessment.
 */
export async function assessWithGemini(
  conversation: ConversationMessage[],
  { ageTier, situation }: AssessmentOptions = {}
): Promise<ConversationAssessment> {
  // Fall back to rule-based assessment directly
  return assessConversation(conversation, { ageTier, situation });
}

/**
 * Assess a conversation transcript without persisting it anywhere.
 */
export function assessConversation(
  conversation: ConversationMessage[],
  { ageTier, situation }: AssessmentOptions = {}
): ConversationAssessment {
  const tier: AgeTier = ageTier ?? 2;
  const scenario: Service | null = situation ?? null;
  const userMessages = conversation.filter(msg => msg.type === 'user');
  const durationSeconds = calculateDurationSeconds(userMessages);
  const userTurns = userMessages.length;

  const positives: string[] = [];
  const improvements: string[] = [];
  const warnings: string[] = [];

  if (userTurns <= 1) {
    warnings.push('You hung up too quickly. Try to share more information.');
    mapScoreToFeedback(0, positives, improvements, warnings);
    return {
      score: 0,
      passed: false,
      positives,
      improvements,
      warnings,
      metrics: {
        userTurns,
        durationSeconds,
      },
    };
  }

  const normalizedMessages = userMessages.map(msg => normalizeText(msg.text));
  const joined = normalizedMessages.join(' ');

  // Emergency type clarity
  const emergencyKeywords = scenario
    ? EMERGENCY_KEYWORDS[scenario]
    : Object.values(EMERGENCY_KEYWORDS).flat();
  const emergencyMatch = containsAny(joined, emergencyKeywords);
  if (emergencyMatch) {
    positives.push('You told Bobby what kind of emergency it is.');
  } else {
    improvements.push('Say what is happening (fire, someone hurt, etc.).');
  }

  // Location details
  const locationMatch = normalizedMessages.some(
    text => containsAny(text, LOCATION_KEYWORDS) || detectAddressLike(text)
  );
  if (locationMatch) {
    positives.push('You shared where the emergency is happening.');
  } else {
    improvements.push('Remember to say where you are.');
  }

  // People involved
  const peopleMatch = containsAny(joined, PEOPLE_KEYWORDS);
  if (peopleMatch) {
    positives.push('You said who needs help.');
  } else {
    improvements.push('Tell Bobby who is in danger or needs help.');
  }

  // Condition / status
  let conditionMatch = false;
  if (scenario === 'fire') {
    conditionMatch = containsAny(joined, [
      ...CONDITION_KEYWORDS,
      ...FIRE_CONDITION_KEYWORDS,
    ]);
    if (conditionMatch) {
      positives.push('You shared details about the fire and safety.');
    } else {
      improvements.push(
        'Tell Bobby if everyone is safe or out of the building.'
      );
    }
  } else if (scenario === 'police') {
    conditionMatch = containsAny(joined, [
      ...CONDITION_KEYWORDS,
      ...POLICE_CONDITION_KEYWORDS,
    ]);
    if (conditionMatch) {
      positives.push('You shared important safety details.');
    } else {
      improvements.push('Tell Bobby if you are safe or hiding.');
    }
  } else {
    // Medical / Default
    conditionMatch = containsAny(joined, CONDITION_KEYWORDS);
    if (conditionMatch) {
      positives.push('You explained how the person is doing.');
    } else {
      improvements.push('Share if they are hurt, breathing, or awake.');
    }
  }

  // Cooperation (turns & duration)
  const minTurns = MIN_TURNS_BY_TIER[tier];
  const hasEnoughTurns = userTurns >= minTurns;
  const hasDuration = durationSeconds >= 10 || hasEnoughTurns;
  if (hasEnoughTurns && hasDuration) {
    positives.push('You stayed on the line long enough for help.');
  } else {
    warnings.push('Try to stay with Bobby until you share key details.');
  }

  // Relevance
  const irrelevantCount = normalizedMessages.filter(text =>
    containsAny(text, IRRELEVANT_KEYWORDS)
  ).length;
  const irrelevantRatio = irrelevantCount / userTurns;
  if (irrelevantRatio >= 0.4) {
    warnings.push(
      'That sounded off-topic. Emergency calls are for real help only.'
    );
  }

  // Weighted score
  let score = 0;
  if (emergencyMatch) score += 25;
  if (locationMatch) score += 20;
  if (peopleMatch) score += 15;
  if (conditionMatch) score += 15;
  if (hasEnoughTurns && hasDuration) score += 10;
  score += Math.max(0, 15 - Math.round(irrelevantRatio * 100)); // relevance bucket
  score = Math.min(100, Math.max(0, score));

  const passThreshold = PASS_THRESHOLD_BY_TIER[tier];
  const passed = score >= passThreshold;

  // Adjust for severe off-topic
  if (irrelevantRatio >= 0.4) {
    score = Math.min(score, 15);
  }

  // Apply minimum duration threshold (30 seconds)
  if (durationSeconds < 30) {
    warnings.push(
      'The conversation was too short. Try to stay on the line longer and share more details.'
    );
    score = Math.min(score, 20); // Cap score at 20 for too-short calls
  }

  mapScoreToFeedback(score, positives, improvements, warnings);

  return {
    score,
    passed,
    positives: Array.from(new Set(positives)),
    improvements: Array.from(new Set(improvements)),
    warnings: Array.from(new Set(warnings)),
    metrics: {
      userTurns,
      durationSeconds,
    },
  };
}

/**
 * Map assessment score to XP reward (0–100 range).
 */
export function scoreToXP(score: number): number {
  if (score >= 90) return 100;
  if (score >= 80) return 85;
  if (score >= 70) return 75;
  if (score >= 60) return 60;
  if (score >= 45) return 45;
  if (score >= 30) return 25;
  if (score >= 15) return 10;
  return 0;
}
