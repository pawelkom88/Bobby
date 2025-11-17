import { describe, expect, it } from 'vitest';
import { assessConversation } from '@/lib/assessment';
import type { ConversationMessage } from '@/types';

const buildConversation = (messages: string[]): ConversationMessage[] =>
  messages.map((text, index) => ({
    type: 'user',
    text,
    timestamp: new Date(Date.now() + index * 2000).toISOString(),
  }));

describe('assessConversation', () => {
  it('rewards complete emergency details', () => {
    const conversation = buildConversation([
      'Hi Bobby there is a fire in my kitchen at 22 River Road.',
      'My mom is hurt and she is bleeding.',
      'She is awake but coughing from the smoke.',
    ]);

    const assessment = assessConversation(conversation, { ageTier: 2, situation: 'fire' });
    expect(assessment.score).toBeGreaterThanOrEqual(75);
    expect(assessment.passed).toBe(true);
  });

  it('penalizes irrelevant or prank calls', () => {
    const conversation = buildConversation([
      'Can I order a pizza?',
      'Never mind this is just a prank.',
      'Bye.',
    ]);

    const assessment = assessConversation(conversation, { ageTier: 3, situation: 'police' });
    expect(assessment.score).toBeLessThanOrEqual(15);
    expect(assessment.passed).toBe(false);
    expect(assessment.warnings.length).toBeGreaterThan(0);
  });

  it('requires basic details even for youngest tier', () => {
    const conversation = buildConversation([
      'Help my friend is hurt.',
      "We're at the park.",
    ]);

    const assessment = assessConversation(conversation, { ageTier: 1, situation: 'ambulance' });
    expect(assessment.score).toBeGreaterThan(40);
    expect(assessment.passed).toBe(true);
  });
});

