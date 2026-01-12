import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import { mockPush, mockClearSessionMutate } from '../utils/app-page-mocks';

const mockSetSelectedAgeTier = vi.fn().mockResolvedValue(undefined);
vi.mock('@/context/UserDataContext', () => ({
  useUserData: () => ({
    setSelectedAgeTier: mockSetSelectedAgeTier,
  }),
}));

vi.mock('@/components/CartoonButton', () => ({
  default: ({
    children,
    asLink,
    href,
  }: {
    children: React.ReactNode;
    asLink?: boolean;
    href?: string;
  }) =>
    asLink ? (
      <a href={href}>{children}</a>
    ) : (
      <button type="button">{children}</button>
    ),
}));

vi.mock('@/lib/ageTiers', () => ({
  getAllAgeTiers: () => [
    { id: 1, label: '5-7 years' },
    { id: 2, label: '7-10 years' },
    { id: 3, label: '11-12 years' },
  ],
}));


// Import component after mocks
import YourAgePage from '@/app/[locale]/app/your-age/page';

const enMessages = {
  yourAge: {
    title: 'How old is your child?',
    subtitle: 'Select the age range',
    ages: {
      tier1: '5-7 years',
      tier2: '7-10 years',
      tier3: '11-12 years',
    },
  },
  common: {
    back: 'Back',
  },
};

function renderYourAgePage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <YourAgePage />
    </NextIntlClientProvider>
  );
}

describe('YourAgePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session clearing behavior', () => {
    it('should clear session once on mount for authenticated user', async () => {
      renderYourAgePage();

      await waitFor(() => {
        expect(mockClearSessionMutate).toHaveBeenCalledTimes(1);
      });
    });

    it('should not clear session multiple times on re-renders', async () => {
      const { rerender } = renderYourAgePage();

      await waitFor(() => {
        expect(mockClearSessionMutate).toHaveBeenCalledTimes(1);
      });

      // Re-render multiple times
      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <YourAgePage />
        </NextIntlClientProvider>
      );

      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <YourAgePage />
        </NextIntlClientProvider>
      );

      // Should still only be called once
      expect(mockClearSessionMutate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Page rendering', () => {
    it('should render page title and subtitle', () => {
      renderYourAgePage();

      expect(screen.getByText('How old is your child?')).toBeInTheDocument();
      expect(screen.getByText('Select the age range')).toBeInTheDocument();
    });

    it('should render all age tier options', () => {
      renderYourAgePage();

      expect(screen.getByLabelText('Select 5-7 years')).toBeInTheDocument();
      expect(screen.getByLabelText('Select 7-10 years')).toBeInTheDocument();
      expect(screen.getByLabelText('Select 11-12 years')).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderYourAgePage();

      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Age selection', () => {
    it('should call setSelectedAgeTier and navigate when age is selected', async () => {
      renderYourAgePage();

      const tier1Button = screen.getByLabelText('Select 5-7 years');
      fireEvent.click(tier1Button);

      await waitFor(() => {
        expect(mockSetSelectedAgeTier).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/choose-emergency');
      });
    });
  });
});
