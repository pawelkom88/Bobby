'use client';

import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/storage';
import type { UserSettings } from '@/types';
import AccessibilityToggle from './AccessibilityToggle';
import CartoonButton from './CartoonButton';

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
  const [settings, setSettings] = useState<UserSettings>({
    subtitles: true,
    slowedSpeech: false,
    reducedSensory: false,
    fontSize: 'medium',
    colorMode: 'default',
    dyslexiaFont: false,
  });

  const [mounted, setMounted] = useState(false);

  // Load settings from storage on mount
  useEffect(() => {
    const currentSettings = getSettings();
    setSettings(currentSettings);
    applySettingsToDocument(currentSettings);
    setMounted(true);
  }, []);

  /**
   * Handle individual setting changes
   */
  const handleSettingChange = (key: keyof UserSettings, value: boolean | string) => {
    const newSettings = {
      ...settings,
      [key]: value,
    } as UserSettings;
    setSettings(newSettings);
    updateSettings(newSettings);
    applySettingsToDocument(newSettings);

    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
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
      console.log('✅ Dyslexia-font class added');
    } else {
      root.classList.remove('dyslexia-font');
      console.log('❌ Dyslexia-font class removed');
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
    <div className="accessibility-section" role="region" aria-label="Accessibility settings">
      <div className="accessibility-section-header">
        <h2 className="accessibility-section-title">Accessibility Settings</h2>
      </div>

      <div className="accessibility-toggles">
        {/* Dyslexia-Friendly Font Toggle */}
        <AccessibilityToggle
          id="dyslexia-font-toggle"
          label="Dyslexia-Friendly Font"
          icon={<span className="accessibility-icon">A</span>}
          checked={settings.dyslexiaFont}
          onChange={(checked) => handleSettingChange('dyslexiaFont', checked)}
          ariaLabel="Use dyslexia-friendly font for better readability"
        />

        {/* Slowed Speech Mode Toggle */}
        <AccessibilityToggle
          id="slowed-speech-toggle"
          label="Slowed Speech Mode"
          icon={<span className="accessibility-icon">🎤</span>}
          checked={settings.slowedSpeech}
          onChange={(checked) => handleSettingChange('slowedSpeech', checked)}
          ariaLabel="Slow down speech for better understanding"
        />

        {/* Reduced Sensory Mode Toggle */}
        <AccessibilityToggle
          id="reduced-sensory-toggle"
          label="Reduced Sensory Mode"
          icon={<span className="accessibility-icon">✨</span>}
          checked={settings.reducedSensory}
          onChange={(checked) => handleSettingChange('reducedSensory', checked)}
          ariaLabel="Reduce animations and visual effects"
        />
      </div>

      {/* Additional Settings */}
      <div className="accessibility-additional-settings">
        {/* Font Size Control */}
        <div className="accessibility-setting-group">
          <label htmlFor="font-size-select" className="accessibility-setting-label">
            📏 Font Size
          </label>
          <select
            id="font-size-select"
            value={settings.fontSize}
            onChange={(e) => handleSettingChange('fontSize', e.target.value)}
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
          <label htmlFor="color-mode-select" className="accessibility-setting-label">
            🎨 Color Mode
          </label>
          <select
            id="color-mode-select"
            value={settings.colorMode}
            onChange={(e) => handleSettingChange('colorMode', e.target.value)}
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

