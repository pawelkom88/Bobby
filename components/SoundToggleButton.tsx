'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSound } from './SoundProvider';

export default function SoundToggleButton() {
  const [mounted, setMounted] = useState(false);
  const { soundEnabled, toggleSound } = useSound();
  const t = useTranslations('soundToggle');

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
    } catch {}
    toggleSound();
  };

  return (
    <div
      className="sound-toggle-container"
      role="region"
      aria-label={t('regionLabel')}
    >
      <button
        type="button"
        className="sound-toggle-button"
        onClick={handleClick}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? t('turnOff') : t('turnOn')}
        title={soundEnabled ? t('on') : t('off')}
      >
        {soundEnabled ? t('on') : t('off')}
      </button>
    </div>
  );
}
