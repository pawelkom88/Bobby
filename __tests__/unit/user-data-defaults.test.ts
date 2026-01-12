import { describe, expect, it } from 'vitest';
import { getDefaultUserData } from '@/lib/user-data-defaults';

describe('getDefaultUserData', () => {
  it('returns the expected default structure', () => {
    const data = getDefaultUserData();

    expect(data).toEqual({
      userName: '',
      totalXP: 0,
      level: 1,
      conversations: [],
      badges: [],
      settings: {
        subtitles: true,
        slowedSpeech: false,
        reducedSensory: false,
        fontSize: 'medium',
        colorMode: 'default',
        dyslexiaFont: false,
      },
    });
  });
});
