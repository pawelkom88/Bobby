'use client';

import { useState, useEffect } from 'react';
import { useSound } from './SoundProvider';

export default function SoundToggleBottomNav() {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { soundEnabled, toggleSound } = useSound();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleClick = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    try {
      const audio = new Audio('/sfx/sound-on-off.mp3');
      audio.volume = 0.5;
      void audio.play();
    } catch {
      // Audio playback failed silently
    }

    setTimeout(() => {
      toggleSound();
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }, 100);
  };

  return (
    <button
      type="button"
      className={`sound-toggle-bottom ${soundEnabled ? '' : 'off'} ${isAnimating ? 'animating' : ''}`}
      onClick={handleClick}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? 'Turn UI sound off' : 'Turn UI sound on'}
      title={soundEnabled ? 'UI Sound: On' : 'UI Sound: Off'}
    >
      <div className="sound-toggle-icon">
        <div className="sound-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <div className="mute-x"></div>
      </div>
    </button>
  );
}

