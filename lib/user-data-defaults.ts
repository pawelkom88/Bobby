import type { UserData } from '@/types';

export function getDefaultUserData(): UserData {
  return {
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
  };
}
