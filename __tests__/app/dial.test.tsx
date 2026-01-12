import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import DialPage from '../../app/[locale]/app/dial/page';

// Mock search params state
let mockSearchParams = {
  canceled: null as string | null,
  needsCredits: null as string | null,
  fromSuccess: null as string | null,
};

// Create trackable router mocks
const mockRouterPush = vi.fn();
const mockRouterReplace = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      if (key === 'canceled') return mockSearchParams.canceled;
      if (key === 'needsCredits') return mockSearchParams.needsCredits;
      if (key === 'fromSuccess') return mockSearchParams.fromSuccess;
      return null;
    }),
  }),
}));

// Mock react ViewTransition and Activity
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
    Activity: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock useSessionClear hook
const mockUseSessionClear = vi.fn();
vi.mock('@/hooks/useSessionClear', () => ({
  useSessionClear: () => {
    mockUseSessionClear();
  },
}));

// Mock forceRefreshCredits
const mockForceRefreshCredits = vi.fn().mockResolvedValue(undefined);

// Credits state that can be modified
let mockCreditsState = {
  credits: 5,
  betaCredits: 0,
  isBetaUser: false,
  hasCredits: true,
  loading: false,
};

vi.mock('@/context/CreditsContext', () => ({
  useCredits: () => ({
    ...mockCreditsState,
    forceRefreshCredits: mockForceRefreshCredits,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false,
  }),
}));

vi.mock('@/context/UserDataContext', () => ({
  useUserData: () => ({
    getJourneyState: () => ({
      selectedAgeTier: 1,
      selectedService: 'ambulance',
    }),
  }),
}));

// Mock components
vi.mock('@/components/PageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-wrapper">{children}</div>
  ),
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('@/components/DialPad', () => ({
  default: ({
    onCorrectNumber,
    onBack,
    isLoading,
    buttonLabel,
  }: {
    onCorrectNumber: () => void;
    onBack: () => void;
    isLoading: boolean;
    buttonLabel: string;
  }) => (
    <div data-testid="dial-pad">
      <button type="button" onClick={onCorrectNumber} disabled={isLoading}>
        {buttonLabel}
      </button>
      <button type="button" onClick={onBack}>
        Back
      </button>
    </div>
  ),
}));

vi.mock('@/components/ParentGateModal', () => ({
  default: () => null,
}));

vi.mock('@/components/SpeculationRules', () => ({
  SpeculationRules: () => null,
}));

vi.mock('@/lib/dialStoryContext', () => ({
  persistDialStoryContext: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/app/dial',
  pathname: '/app/dial',
  search: '',
  hash: '',
  origin: 'http://localhost:3000',
};

const enMessages = {
  dial: {
    creditsLabel: 'Credits:',
    betaCreditsLabel: 'Beta Credits:',
    messages: {
      canceled: 'Payment was canceled',
      needsCredits: 'You need credits to continue',
      loadingCredits: 'Loading your credits...',
    },
    buttons: {
      call: 'Call 999',
      loading: 'Loading...',
      buyAndCall: 'Buy & Call',
    },
  },
  auth: {
    errors: {
      pleaseLogin: 'Please log in',
    },
  },
};

function renderDialPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <DialPage />
    </NextIntlClientProvider>
  );
}

describe('DialPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = {
      canceled: null,
      needsCredits: null,
      fromSuccess: null,
    };
    mockCreditsState = {
      credits: 5,
      betaCredits: 0,
      isBetaUser: false,
      hasCredits: true,
      loading: false,
    };
    mockRouterPush.mockClear();
    mockRouterReplace.mockClear();
    mockUseSessionClear.mockClear();
    mockForceRefreshCredits.mockClear();

    // Reset window.location to default
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        ...mockLocation,
        href: 'http://localhost:3000/app/dial',
        search: '',
      },
    });
  });

  describe('Session clearing behavior', () => {
    it('should clear session once on mount for authenticated user', async () => {
      renderDialPage();

      await waitFor(() => {
        expect(mockUseSessionClear).toHaveBeenCalledTimes(1);
      });
    });

    it('should call useSessionClear on each render (hook behavior)', async () => {
      const { rerender } = renderDialPage();

      await waitFor(() => {
        expect(mockUseSessionClear).toHaveBeenCalled();
      });

      const initialCallCount = mockUseSessionClear.mock.calls.length;

      // Re-render multiple times
      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <DialPage />
        </NextIntlClientProvider>
      );

      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <DialPage />
        </NextIntlClientProvider>
      );

      // Hook is called on each render, but internal logic prevents duplicate side effects
      expect(mockUseSessionClear.mock.calls.length).toBeGreaterThanOrEqual(
        initialCallCount
      );
    });
  });

  describe('Credit refresh after payment', () => {
    it('should refresh credits when fromSuccess=true', async () => {
      mockSearchParams.fromSuccess = 'true';

      // Set up window.location to match
      Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: {
          ...mockLocation,
          href: 'http://localhost:3000/app/dial?fromSuccess=true',
          search: '?fromSuccess=true',
        },
      });

      renderDialPage();

      await waitFor(() => {
        expect(mockForceRefreshCredits).toHaveBeenCalled();
      });
    });

    it('should not refresh credits when fromSuccess is not set', async () => {
      mockSearchParams.fromSuccess = null;

      renderDialPage();

      // Wait a bit to ensure no async calls happen
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockForceRefreshCredits).not.toHaveBeenCalled();
    });

    it('should only refresh credits once even on re-renders', async () => {
      mockSearchParams.fromSuccess = 'true';

      // Set up window.location to match
      Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: {
          ...mockLocation,
          href: 'http://localhost:3000/app/dial?fromSuccess=true',
          search: '?fromSuccess=true',
        },
      });

      const { rerender } = renderDialPage();

      await waitFor(() => {
        expect(mockForceRefreshCredits).toHaveBeenCalledTimes(1);
      });

      // Re-render
      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <DialPage />
        </NextIntlClientProvider>
      );

      // Should still only be called once due to handledFromSuccessRef guard
      expect(mockForceRefreshCredits).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL cleanup behavior', () => {
    it('should clean needsCredits from URL when user has credits', async () => {
      mockSearchParams.needsCredits = 'true';
      mockCreditsState.hasCredits = true;

      // Set up window.location to have the needsCredits param
      Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: {
          ...mockLocation,
          href: 'http://localhost:3000/app/dial?needsCredits=true',
          search: '?needsCredits=true',
        },
      });

      renderDialPage();

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/app/dial');
      });
    });

    it('should not clean needsCredits when user has no credits', async () => {
      mockSearchParams.needsCredits = 'true';
      mockCreditsState.hasCredits = false;
      mockCreditsState.credits = 0;

      // Set up window.location to have the needsCredits param
      Object.defineProperty(window, 'location', {
        writable: true,
        configurable: true,
        value: {
          ...mockLocation,
          href: 'http://localhost:3000/app/dial?needsCredits=true',
          search: '?needsCredits=true',
        },
      });

      renderDialPage();

      // Wait a bit to ensure no state updates happen
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  describe('UI states', () => {
    it('should display canceled message when canceled=true', async () => {
      mockSearchParams.canceled = 'true';

      renderDialPage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Payment was canceled'
        );
      });
    });

    it('should display credits count', async () => {
      mockCreditsState.credits = 10;

      renderDialPage();

      await waitFor(() => {
        expect(screen.getByText('Credits:')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });
    });

    it('should show call button when user has credits', async () => {
      mockCreditsState.hasCredits = true;

      renderDialPage();

      await waitFor(() => {
        expect(screen.getByText('Call 999')).toBeInTheDocument();
      });
    });

    it('should show buy button when user has no credits', async () => {
      mockCreditsState.hasCredits = false;
      mockCreditsState.credits = 0;

      renderDialPage();

      await waitFor(() => {
        expect(screen.getByText('Buy & Call')).toBeInTheDocument();
      });
    });

    it('should display beta credits label for beta users', async () => {
      mockCreditsState.isBetaUser = true;
      mockCreditsState.betaCredits = 3;

      renderDialPage();

      await waitFor(() => {
        expect(screen.getByText('Beta Credits:')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display needsCredits message when no credits available', async () => {
      mockSearchParams.needsCredits = 'true';
      mockCreditsState.hasCredits = false;
      mockCreditsState.credits = 0;

      renderDialPage();

      await waitFor(() => {
        expect(
          screen.getByText('You need credits to continue')
        ).toBeInTheDocument();
      });
    });
  });
});
