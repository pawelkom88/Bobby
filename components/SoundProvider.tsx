'use client';

import { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type SoundContextValue = {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

/**
 * Preload audio files to eliminate loading delays when playing sounds
 */
function preloadAudioFiles() {
  if (typeof window === 'undefined') return;

  // List of all MP3 files in the public/sfx directory
  const audioFiles = [
    '/sfx/fanfare.mp3',
    '/sfx/bttf-dial-1.mp3',
    '/sfx/bttf-dial-2.mp3',
    '/sfx/bttf-dial-3.mp3',
    '/sfx/connecting.mp3',
    '/sfx/sound-on-off.mp3',
  ];

  // Preload each audio file
  audioFiles.forEach(url => {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      // Call load() to start preloading
      audio.load();
    } catch (error) {
      // Silently ignore preloading errors
      console.warn(`Failed to preload audio: ${url}`, error);
    }
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

  // Preload audio files when the component mounts
  useEffect(() => {
    preloadAudioFiles();
  }, []);

  return (
    <SoundContext.Provider
      value={{ soundEnabled, setSoundEnabled, toggleSound }}
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
