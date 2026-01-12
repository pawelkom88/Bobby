'use client';

import { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type SoundContextValue = {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  loadAudio: (url: string) => Promise<HTMLAudioElement>;
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

// Cache for lazy-loaded audio elements
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Lazy load audio files on-demand to reduce initial page load
 */
function loadAudio(url: string): Promise<HTMLAudioElement> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  // Return cached audio if available
  if (audioCache.has(url)) {
    return Promise.resolve(audioCache.get(url)!);
  }

  // Create and load new audio element
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';
    
    audio.addEventListener('canplaythrough', () => {
      audioCache.set(url, audio);
      resolve(audio);
    }, { once: true });

    audio.addEventListener('error', () => {
      reject(new Error(`Failed to load audio: ${url}`));
    }, { once: true });

    audio.src = url;
    audio.load();
  });
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>(
    'bobby-sound-enabled',
    true
  );

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return (
    <SoundContext.Provider
      value={{ soundEnabled, setSoundEnabled, toggleSound, loadAudio }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return ctx;
}
