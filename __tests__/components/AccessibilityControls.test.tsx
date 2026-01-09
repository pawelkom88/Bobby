import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AccessibilityControls from '../../components/AccessibilityControls';

// Mock the storage module
const mockSettings = {
  subtitles: true,
  slowedSpeech: false,
  reducedSensory: false,
  fontSize: 'medium' as const,
  colorMode: 'default' as const,
  dyslexiaFont: false,
};

vi.mock('@/lib/storage', () => ({
  getSettings: vi.fn(() => ({ ...mockSettings })),
  updateSettings: vi.fn(),
}));

import { getSettings, updateSettings } from '@/lib/storage';
const mockGetSettings = vi.mocked(getSettings);
const mockUpdateSettings = vi.mocked(updateSettings);

describe('AccessibilityControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockReturnValue({ ...mockSettings });
    // Reset document classes
    document.documentElement.classList.remove('dyslexia-font', 'high-contrast', 'reduced-sensory');
    document.documentElement.style.removeProperty('--font-size-base');
  });

  describe('Initial state', () => {
    it('should load settings from storage on mount', () => {
      render(<AccessibilityControls />);
      
      expect(mockGetSettings).toHaveBeenCalled();
    });

    it('should render all accessibility options', () => {
      render(<AccessibilityControls />);
      
      expect(screen.getByLabelText('Enable subtitles')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable slowed speech mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable reduced sensory mode')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable dyslexia-friendly font')).toBeInTheDocument();
      expect(screen.getByLabelText('Select font size')).toBeInTheDocument();
      expect(screen.getByLabelText('Select color mode')).toBeInTheDocument();
    });

    it('should reflect loaded settings in checkboxes', () => {
      mockGetSettings.mockReturnValue({
        ...mockSettings,
        subtitles: true,
        slowedSpeech: true,
      });

      render(<AccessibilityControls />);
      
      expect(screen.getByLabelText('Enable subtitles')).toBeChecked();
      expect(screen.getByLabelText('Enable slowed speech mode')).toBeChecked();
      expect(screen.getByLabelText('Enable reduced sensory mode')).not.toBeChecked();
    });
  });

  describe('Setting changes', () => {
    it('should update storage when checkbox is toggled', () => {
      render(<AccessibilityControls />);
      
      const subtitlesCheckbox = screen.getByLabelText('Enable subtitles');
      fireEvent.click(subtitlesCheckbox);
      
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ subtitles: false })
      );
    });

    it('should update storage when font size is changed', () => {
      render(<AccessibilityControls />);
      
      const fontSizeSelect = screen.getByLabelText('Select font size');
      fireEvent.change(fontSizeSelect, { target: { value: 'large' } });
      
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ fontSize: 'large' })
      );
    });

    it('should call onSettingsChange callback when settings change', () => {
      const onSettingsChange = vi.fn();
      render(<AccessibilityControls onSettingsChange={onSettingsChange} />);
      
      const subtitlesCheckbox = screen.getByLabelText('Enable subtitles');
      fireEvent.click(subtitlesCheckbox);
      
      expect(onSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({ subtitles: false })
      );
    });
  });

  describe('Document styling', () => {
    it('should apply dyslexia font class when enabled', () => {
      mockGetSettings.mockReturnValue({
        ...mockSettings,
        dyslexiaFont: true,
      });

      render(<AccessibilityControls />);
      
      expect(document.documentElement.classList.contains('dyslexia-font')).toBe(true);
    });

    it('should apply high-contrast class when color mode is high-contrast', () => {
      mockGetSettings.mockReturnValue({
        ...mockSettings,
        colorMode: 'high-contrast',
      });

      render(<AccessibilityControls />);
      
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });

    it('should apply reduced-sensory class when enabled', () => {
      mockGetSettings.mockReturnValue({
        ...mockSettings,
        reducedSensory: true,
      });

      render(<AccessibilityControls />);
      
      expect(document.documentElement.classList.contains('reduced-sensory')).toBe(true);
    });

    it('should set font size CSS variable', () => {
      mockGetSettings.mockReturnValue({
        ...mockSettings,
        fontSize: 'large',
      });

      render(<AccessibilityControls />);
      
      expect(document.documentElement.style.getPropertyValue('--font-size-base')).toBe('20px');
    });
  });
});

