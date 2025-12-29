'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUserData } from '@/context/UserDataContext';
import type { UserSettings } from '@/types';
import AccessibilityToggle from './AccessibilityToggle';
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
  const t = useTranslations('accessibility');
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
      <h2 className="accessibility-section-title">{t('title')}</h2>
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
          label={t('uiSound.label')}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="24"
              height="20"
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
          ariaLabel={soundEnabled ? t('uiSound.off') : t('uiSound.on')}
        />

        {/* Dyslexia-Friendly Font Toggle */}
        <AccessibilityToggle
          id="dyslexia-font-toggle"
          label={t('dyslexiaFont.label')}
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
                fontFamily="Arial"
                fontSize="100"
                fontWeight="bold"
                fill="black"
                stroke="black"
                strokeWidth="4"
                textAnchor="middle"
              >
                A
              </text>
            </svg>
          }
          checked={settings.dyslexiaFont}
          onChange={checked => handleSettingChange('dyslexiaFont', checked)}
          ariaLabel={t('dyslexiaFont.aria')}
        />

        {/* Slowed Speech Mode Toggle */}
        {/*<AccessibilityToggle*/}
        {/*  id="slowed-speech-toggle"*/}
        {/*  label={t('slowedSpeech.label')}*/}
        {/*  icon={*/}
        {/*    <svg*/}
        {/*      xmlns="http://www.w3.org/2000/svg"*/}
        {/*      viewBox="0 0 120 100"*/}
        {/*      width="24"*/}
        {/*      height="24"*/}
        {/*      fill="#BAE1F5"*/}
        {/*      stroke="black"*/}
        {/*      strokeWidth="6"*/}
        {/*      strokeLinejoin="round"*/}
        {/*    >*/}
        {/*      <path*/}
        {/*        d="M20 20*/}
        {/*   H100*/}
        {/*   a10 10 0 0 1 10 10*/}
        {/*   V60*/}
        {/*   a10 10 0 0 1 -10 10*/}
        {/*   H50*/}
        {/*   L30 85*/}
        {/*   V70*/}
        {/*   H20*/}
        {/*   a10 10 0 0 1 -10 -10*/}
        {/*   V30*/}
        {/*   a10 10 0 0 1 10 -10*/}
        {/*   Z"*/}
        {/*      />*/}
        {/*    </svg>*/}
        {/*  }*/}
        {/*  checked={settings.slowedSpeech}*/}
        {/*  onChange={checked => handleSettingChange('slowedSpeech', checked)}*/}
        {/*  ariaLabel={t('slowedSpeech.aria')}*/}
        {/*/>*/}

        {/* Reduced Sensory Mode Toggle */}
        <AccessibilityToggle
          id="reduced-sensory-toggle"
          label={t('reducedSensory.label')}
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
          ariaLabel={t('reducedSensory.aria')}
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.2261 2L0.11499 14H2.18111L2.95889 11H6.04092L6.81869 14H8.88482L5.77371 2H3.2261ZM5.5224 9L4.4999 5.05609L3.47741 9H5.5224Z"
                fill="#000000"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14 7.33682C13.5454 7.12085 13.0368 7 12.5 7C10.567 7 9.00004 8.567 9.00004 10.5C9.00004 12.433 10.567 14 12.5 14C13.0368 14 13.5454 13.8792 14 13.6632V14H16V7H14V7.33682ZM11 10.5C11 9.67157 11.6716 9 12.5 9C13.3285 9 14 9.67157 14 10.5C14 11.3284 13.3285 12 12.5 12C11.6716 12 11 11.3284 11 10.5Z"
                fill="#000000"
              />
            </svg>
            {t('fontSize.label')}
          </label>
          <select
            id="font-size-select"
            value={settings.fontSize}
            onChange={e => handleSettingChange('fontSize', e.target.value)}
            className="accessibility-select"
            aria-label={t('fontSize.aria')}
          >
            <option value="small">{t('fontSize.small')}</option>
            <option value="medium">{t('fontSize.medium')}</option>
            <option value="large">{t('fontSize.large')}</option>
            <option value="xlarge">{t('fontSize.xlarge')}</option>
          </select>
        </div>

        {/* Color Mode Control */}
        <div className="accessibility-setting-group">
          <label
            htmlFor="color-mode-select"
            className="accessibility-setting-label"
          >
            <svg
              fill="#000000"
              width="20"
              height="20"
              viewBox="0 0 32 32"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>contrast</title>
              <path d="M0 16q0 3.264 1.28 6.24t3.392 5.088 5.12 3.424 6.208 1.248q3.264 0 6.24-1.248t5.088-3.424 3.392-5.088 1.28-6.24-1.28-6.208-3.392-5.12-5.088-3.392-6.24-1.28q-3.264 0-6.208 1.28t-5.12 3.392-3.392 5.12-1.28 6.208zM4 16q0-3.264 1.6-6.016t4.384-4.352 6.016-1.632 6.016 1.632 4.384 4.352 1.6 6.016-1.6 6.048-4.384 4.352-6.016 1.6-6.016-1.6-4.384-4.352-1.6-6.048zM16 26.016q2.72 0 5.024-1.344t3.648-3.648 1.344-5.024-1.344-4.992-3.648-3.648-5.024-1.344v20z"></path>
            </svg>
            {t('colorMode.label')}
          </label>
          <select
            id="color-mode-select"
            value={settings.colorMode}
            onChange={e => handleSettingChange('colorMode', e.target.value)}
            className="accessibility-select"
            aria-label={t('colorMode.aria')}
          >
            <option value="default">{t('colorMode.default')}</option>
            <option value="high-contrast">{t('colorMode.highContrast')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
