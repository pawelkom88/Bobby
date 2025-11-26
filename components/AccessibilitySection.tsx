'use client';

import { useEffect, useState } from 'react';
import { useUserData } from '@/context/UserDataContext';
import type { UserSettings } from '@/types';
import AccessibilityToggle from './AccessibilityToggle';
import CartoonButton from './CartoonButton';
import { useSound } from './SoundProvider';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface AccessibilitySectionProps {
  onSettingsChange?: (settings: UserSettings) => void;
}

/**
 * Accessibility settings section with toggle controls
 * Composable component that manages accessibility features
 */
export default function AccessibilitySection({
  onSettingsChange,
}: AccessibilitySectionProps) {
  const { userData, updateSettings } = useUserData();
  const settings = userData.settings;
  const [mounted, setMounted] = useState(false);
  const { soundEnabled, toggleSound } = useSound();

  // Apply settings to document on mount and when settings change
  useEffect(() => {
    applySettingsToDocument(settings);
    setMounted(true);
  }, [settings]);

  /**
   * Handle individual setting changes
   */
  const handleSettingChange = async (
    key: keyof UserSettings,
    value: boolean | string
  ) => {
    const newSettings = {
      ...settings,
      [key]: value,
    } as UserSettings;

    try {
      await updateSettings(newSettings);
      applySettingsToDocument(newSettings);

      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }
    } catch (error) {
      logger.error('Error updating settings:', error);
    }
  };

  /**
   * Handle sound toggle with sound effect
   */
  const handleSoundToggle = () => {
    try {
      const audio = new Audio('/sfx/sound-on-off.mp3');
      audio.volume = 0.5;
      void audio.play();
    } catch {
      // Audio playback failed silently
    }
    toggleSound();
  };

  /**
   * Apply settings to document root for global effects
   */
  const applySettingsToDocument = (newSettings: UserSettings) => {
    const root = document.documentElement;

    // Font size
    const fontSizeMap: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '20px',
      xlarge: '24px',
    };
    root.style.setProperty(
      '--font-size-base',
      fontSizeMap[newSettings.fontSize] || '16px'
    );

    // Dyslexia font
    if (newSettings.dyslexiaFont) {
      root.classList.add('dyslexia-font');
      logger.log('✅ Dyslexia-font class added');
    } else {
      root.classList.remove('dyslexia-font');
      logger.log('❌ Dyslexia-font class removed');
    }

    // Color mode
    if (newSettings.colorMode === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced sensory
    if (newSettings.reducedSensory) {
      root.classList.add('reduced-sensory');
    } else {
      root.classList.remove('reduced-sensory');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div role="region" aria-label="Accessibility settings">
      <h2 className="accessibility-section-title">Accessibility Settings</h2>
      <Image
        className="accessibility-image"
        src="/bobby-accessibility.png"
        alt="Bobby Accessibility"
        width={200}
        height={200}
      />
      <div className="accessibility-toggles">
        {/* UI Sound Toggle */}
        <AccessibilityToggle
          id="ui-sound-toggle"
          label="UI Sound"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="32"
              height="32"
              role="img"
              aria-label="Musical note"
            >
              <g fill="#000000" fillRule="evenodd">
                <ellipse cx="18" cy="46" rx="11" ry="9" />
                <rect x="25" y="10" width="4" height="36" rx="1" />
                <path d="M29 12c7 2.6 12 6.8 12 14.5 0 6.3-3.6 10.6-3.6 10.6a2 2 0 1 1-3.2-2.2S37.4 37 37.4 30.5C37.4 24 32 20 29 18z" />
              </g>
            </svg>
          }
          checked={soundEnabled}
          onChange={handleSoundToggle}
          ariaLabel={soundEnabled ? 'Turn UI sound off' : 'Turn UI sound on'}
        />

        {/* Dyslexia-Friendly Font Toggle */}
        <AccessibilityToggle
          id="dyslexia-font-toggle"
          label="Dyslexia-Friendly Font"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 100 120"
              width="18"
              height="24"
            >
              <text
                x="50"
                y="90"
                font-family="Arial"
                font-size="100"
                font-weight="bold"
                fill="none"
                stroke="black"
                stroke-width="4"
                text-anchor="middle"
              >
                A
              </text>
            </svg>
          }
          checked={settings.dyslexiaFont}
          onChange={checked => handleSettingChange('dyslexiaFont', checked)}
          ariaLabel="Use dyslexia-friendly font for better readability"
        />

        {/* Slowed Speech Mode Toggle */}
        <AccessibilityToggle
          id="slowed-speech-toggle"
          label="Slowed Speech Mode"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 120 100"
              width="24"
              height="32"
              fill="#BAE1F5"
              stroke="black"
              strokeWidth="6"
              strokeLinejoin="round"
            >
              <path
                d="M20 20
           H100
           a10 10 0 0 1 10 10
           V60
           a10 10 0 0 1 -10 10
           H50
           L30 85
           V70
           H20
           a10 10 0 0 1 -10 -10
           V30
           a10 10 0 0 1 10 -10
           Z"
              />
            </svg>
          }
          checked={settings.slowedSpeech}
          onChange={checked => handleSettingChange('slowedSpeech', checked)}
          ariaLabel="Slow down speech for better understanding"
        />

        {/* Reduced Sensory Mode Toggle */}
        <AccessibilityToggle
          id="reduced-sensory-toggle"
          label="Reduced Sensory Mode"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 120 70"
              width="32"
              height="24"
              fill="none"
              stroke="black"
              strokeWidth="6"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M10 35 Q60 -5 110 35 Q60 75 10 35 Z" />
              <circle fill="black" cx="60" cy="35" r="15" />
            </svg>
          }
          checked={settings.reducedSensory}
          onChange={checked => handleSettingChange('reducedSensory', checked)}
          ariaLabel="Reduce animations and visual effects"
        />
      </div>

      {/* Additional Settings */}
      <div className="accessibility-additional-settings">
        {/* Font Size Control */}
        <div className="accessibility-setting-group">
          <label
            htmlFor="font-size-select"
            className="accessibility-setting-label"
          >
            📏 Font Size
          </label>
          <select
            id="font-size-select"
            value={settings.fontSize}
            onChange={e => handleSettingChange('fontSize', e.target.value)}
            className="accessibility-select"
            aria-label="Select font size for text"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>

        {/* Color Mode Control */}
        <div className="accessibility-setting-group">
          <label
            htmlFor="color-mode-select"
            className="accessibility-setting-label"
          >
            🎨 Color Mode
          </label>
          <select
            id="color-mode-select"
            value={settings.colorMode}
            onChange={e => handleSettingChange('colorMode', e.target.value)}
            className="accessibility-select"
            aria-label="Select color mode for better visibility"
          >
            <option value="default">Default</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </div>
      </div>
    </div>
  );
}
