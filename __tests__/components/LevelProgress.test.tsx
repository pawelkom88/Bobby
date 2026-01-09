import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LevelProgress from '../../components/LevelProgress';

// Mock the UserDataContext
const mockUserData = {
  level: 1,
  totalXP: 0,
  badges: [],
  conversations: [],
  settings: {},
  userName: 'Test User',
};

vi.mock('@/context/UserDataContext', () => ({
  useUserData: vi.fn(() => ({
    userData: mockUserData,
  })),
}));

// Import the mocked module to control it
import { useUserData } from '@/context/UserDataContext';
const mockUseUserData = vi.mocked(useUserData);

const enMessages = {
  levelProgress: {
    regionLabel: 'Level Progress',
    yourScore: 'Your Score',
    level: 'Level {level}',
    progressAriaLabel: 'Level {level}, {percent}% progress',
    xpToNext: '{xp} XP to next level',
  },
};

function renderLevelProgress(showLabel = true) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <LevelProgress showLabel={showLabel} />
    </NextIntlClientProvider>
  );
}

describe('LevelProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Progress calculation', () => {
    it('should show 0% progress at level 1 with 0 XP', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 1, totalXP: 0 },
      } as any);

      renderLevelProgress();

      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    });

    it('should show 50% progress at level 1 with 50 XP (halfway to 100)', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 1, totalXP: 50 },
      } as any);

      renderLevelProgress();

      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    });

    it('should show correct progress at level 2 with 175 XP', () => {
      // Level 2 range: 100-250 (150 XP range)
      // 175 XP = 75 XP into level 2 = 50% progress
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 2, totalXP: 175 },
      } as any);

      renderLevelProgress();

      expect(screen.getByText('Level 2')).toBeInTheDocument();
      expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    });

    it('should show 100% progress at level 10', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 10, totalXP: 2700 },
      } as any);

      renderLevelProgress();

      expect(screen.getByText('Level 10')).toBeInTheDocument();
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    });

    it('should clamp progress between 0 and 100', () => {
      // Edge case: XP somehow exceeds level range
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 1, totalXP: 150 },
      } as any);

      renderLevelProgress();

      // Should be clamped to 100%
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    });
  });

  describe('XP to next level', () => {
    it('should show correct XP needed for next level', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 1, totalXP: 50 },
      } as any);

      renderLevelProgress();

      // Level 1 ends at 100 XP, so 50 XP to go
      expect(screen.getByText('50 XP to next level')).toBeInTheDocument();
    });

    it('should not show XP to next level at level 10', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 10, totalXP: 2700 },
      } as any);

      renderLevelProgress();

      expect(screen.queryByText(/XP to next level/)).not.toBeInTheDocument();
    });
  });

  describe('Label visibility', () => {
    it('should show label when showLabel is true', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 1, totalXP: 0 },
      } as any);

      renderLevelProgress(true);

      expect(screen.getByText('Your Score')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      mockUseUserData.mockReturnValue({
        userData: { ...mockUserData, level: 1, totalXP: 0 },
      } as any);

      renderLevelProgress(false);

      expect(screen.queryByText('Your Score')).not.toBeInTheDocument();
    });
  });
});

