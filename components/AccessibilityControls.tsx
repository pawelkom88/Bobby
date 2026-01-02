'use client';

import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/storage';
import type { UserSettings } from '@/types';

interface AccessibilityControlsProps {
  onSettingsChange?: (settings: UserSettings) => void;
}

/**
 * Accessibility controls component
 */
export default function AccessibilityControls({
  onSettingsChange,
}: AccessibilityControlsProps) {
  const [settings, setSettings] = useState<UserSettings>({
    subtitles: true,
    slowedSpeech: false,
    reducedSensory: false,
    fontSize: 'medium',
    colorMode: 'default',
    dyslexiaFont: false,
  });

  useEffect(() => {
    const currentSettings = getSettings();
    setSettings(currentSettings);
  }, []);

  const handleSettingChange = (
    key: keyof UserSettings,
    value: boolean | string
  ) => {
    const newSettings = {
      ...settings,
      [key]: value,
    } as UserSettings;
    setSettings(newSettings);
    updateSettings(newSettings);

    // Apply settings to document
    applySettingsToDocument(newSettings);

    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

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
    } else {
      root.classList.remove('dyslexia-font');
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

  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  return (
    <div
      className="accessibility-controls"
      role="region"
      aria-label="Accessibility settings"
    >
      <h3 className="accessibility-title">Accessibility Settings</h3>

      <div className="accessibility-options">
        <label className="accessibility-option">
          <input
            type="checkbox"
            checked={settings.subtitles}
            onChange={e => handleSettingChange('subtitles', e.target.checked)}
            aria-label="Enable subtitles"
          />
          <span>Subtitles</span>
        </label>

        <label className="accessibility-option">
          <input
            type="checkbox"
            checked={settings.slowedSpeech}
            onChange={e =>
              handleSettingChange('slowedSpeech', e.target.checked)
            }
            aria-label="Enable slowed speech mode"
          />
          <span>Slowed Speech</span>
        </label>

        <label className="accessibility-option">
          <input
            type="checkbox"
            checked={settings.reducedSensory}
            onChange={e =>
              handleSettingChange('reducedSensory', e.target.checked)
            }
            aria-label="Enable reduced sensory mode"
          />
          <span>Reduced Sensory Mode</span>
        </label>

        <label className="accessibility-option">
          <input
            type="checkbox"
            checked={settings.dyslexiaFont}
            onChange={e =>
              handleSettingChange('dyslexiaFont', e.target.checked)
            }
            aria-label="Enable dyslexia-friendly font"
          />
          <span>Dyslexia-Friendly Font</span>
        </label>

        <div className="accessibility-option">
          <label htmlFor="font-size-select">Font Size:</label>
          <select
            id="font-size-select"
            value={settings.fontSize}
            onChange={e => handleSettingChange('fontSize', e.target.value)}
            aria-label="Select font size"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            {/*<option value="xlarge">Extra Large</option>*/}
          </select>
        </div>

        <div className="accessibility-option">
          <label htmlFor="color-mode-select">Color Mode:</label>
          <select
            id="color-mode-select"
            value={settings.colorMode}
            onChange={e => handleSettingChange('colorMode', e.target.value)}
            aria-label="Select color mode"
          >
            <option value="default">Default</option>
            <option value="high-contrast">High Contrast</option>
          </select>
        </div>
      </div>
    </div>
  );
}
