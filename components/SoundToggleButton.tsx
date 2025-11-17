'use client';

import { useEffect, useState } from 'react';
import { useSound } from './SoundProvider';

export default function SoundToggleButton() {
  const [mounted, setMounted] = useState(false);
  const { soundEnabled, toggleSound } = useSound();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleClick = () => {
    try {
      const audio = new Audio('/sfx/sound-on-off.mp3');
      audio.volume = 0.5;
      void audio.play();
    } catch {

    }
    toggleSound();
  };

  return (
    <div className="sound-toggle-container" role="region" aria-label="Sound controls">
      <button
        type="button"
        className="sound-toggle-button"
        onClick={handleClick}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? 'Turn UI sound off' : 'Turn UI sound on'}
        title={soundEnabled ? 'UI Sound: On' : 'UI Sound: Off'}
      >
        {soundEnabled ? 'UI Sound: On' : 'UI Sound: Off'}
      </button>
    </div>
  );
}


