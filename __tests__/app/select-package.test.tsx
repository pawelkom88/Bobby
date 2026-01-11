import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// Mock all dependencies before importing the component

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      if (key === 'needsCredits') return mockSearchParams.needsCredits;
      if (key === 'canceled') return mockSearchParams.canceled;
      return null;
    }),
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: { src: string; alt: string }) {
    return React.createElement('img', { src: props.src, alt: props.alt });
  },
}));

// Mock react ViewTransition
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock dialStoryContext
const mockGetDialStoryContext = vi.fn();
const mockClearDialStoryContext = vi.fn();
vi.mock('@/lib/dialStoryContext', () => ({
  getDialStoryContext: () => mockGetDialStoryContext(),
  clearDialStoryContext: () => mockClearDialStoryContext(),
  persistDialStoryContext: vi.fn(),
}));

// Mock contexts
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', getIdToken: vi.fn().mockResolvedValue('token') },
    loading: false,
  }),
}));

vi.mock('@/context/CreditsContext', () => ({
  useCredits: () => ({
    credits: 0,
    hasCredits: false,
    loading: false,
    isServerConfirmed: true,
  }),
}));

vi.mock('@/context/UserDataContext', () => ({
  useUserData: () => ({
    getJourneyState: () => null,
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

vi.mock('@/components/CartoonButton', () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/SpeculationRules', () => ({
  SpeculationRules: () => null,
}));

// Mock checkout mutation
const mockCheckoutMutation = {
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  error: null as Error | null,
};

vi.mock('@/hooks/mutations/useCheckoutSession', () => ({
  useCheckoutSession: () => mockCheckoutMutation,
}));

// Mock search params state
let mockSearchParams = { needsCredits: null as string | null, canceled: null as string | null };

// Import component after mocks
import SelectPackagePage from '@/app/[locale]/app/select-package/page';

const enMessages = {
  selectPackage: {
    title: 'Select Package',
    subtitle: 'Choose your package',
    storySummary: {
      title: 'Your current selections',
      ageLabel: 'Age',
      scenarioLabel: 'Scenario',
      changeSelection: 'Change selection',
    },
    messages: {
      canceled: 'Payment was canceled',
    },
    errors: {
      loginRequired: 'Please login',
      checkoutFailed: 'Checkout failed',
    },
    loading: 'Loading...',
    packs: {
      rookie: 'Rookie Pack',
      rookieSubtitle: '5 calls',
      hero: 'Hero Pack',
      heroSubtitle: '15 calls',
    },
    rookie: {
      idealFor: 'Ideal for beginners',
      price: '$4.99',
      includes: 'Includes:',
      features: ['5 practice calls', 'All scenarios'],
      bestFor: 'Best for:',
      bestForDesc: 'Testing the app',
      cta: 'Get Started',
    },
    hero: {
      idealFor: 'Ideal for families',
      price: '$9.99',
      includes: 'Includes:',
      features: ['15 practice calls', 'All scenarios', 'Priority support'],
      whyChoose: 'Why choose:',
      whyChooseDesc: 'Best value',
      cta: 'Go Hero',
    },
    microcopy: {
      oneTimePurchase: 'One-time purchase',
      callsNeverExpire: 'Calls never expire',
    },
  },
  common: {
    back: 'Back',
  },
  yourAge: {
    ages: {
      tier1: '5-7 years',
      tier2: '7-10 years',
      tier3: '11-12 years',
    },
  },
  chooseEmergency: {
    services: {
      fire: 'Fire',
      ambulance: 'Ambulance',
      police: 'Police',
    },
  },
};

function renderSelectPackagePage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SelectPackagePage />
    </NextIntlClientProvider>
  );
}

describe('SelectPackagePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { needsCredits: null, canceled: null };
    mockGetDialStoryContext.mockReturnValue(null);
    mockCheckoutMutation.error = null;
    mockCheckoutMutation.isPending = false;
  });

  describe('Story context loading behavior', () => {
    it('should load story context when needsCredits=true', async () => {
      mockSearchParams.needsCredits = 'true';
      mockGetDialStoryContext.mockReturnValue({
        ageTier: 1,
        service: 'ambulance',
      });

      renderSelectPackagePage();

      await waitFor(() => {
        expect(mockGetDialStoryContext).toHaveBeenCalled();
      });
    });

    it('should clear story context when needsCredits is not true', async () => {
      mockSearchParams.needsCredits = null;

      renderSelectPackagePage();

      await waitFor(() => {
        expect(mockClearDialStoryContext).toHaveBeenCalled();
      });
    });

    it('should show story summary when needsCredits=true and context exists', async () => {
      mockSearchParams.needsCredits = 'true';
      mockGetDialStoryContext.mockReturnValue({
        ageTier: 1,
        service: 'ambulance',
      });

      renderSelectPackagePage();

      await waitFor(() => {
        expect(
          screen.getByText('Your current selections')
        ).toBeInTheDocument();
      });
    });

    it('should not show story summary when needsCredits is not set', async () => {
      mockSearchParams.needsCredits = null;

      renderSelectPackagePage();

      await waitFor(() => {
        expect(screen.getByText('Select Package')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('Your current selections')
      ).not.toBeInTheDocument();
    });
  });

  describe('Canceled state', () => {
    it('should show canceled message when canceled=true', async () => {
      mockSearchParams.canceled = 'true';

      renderSelectPackagePage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Payment was canceled'
        );
      });
    });

    it('should not show canceled message when canceled is not set', async () => {
      mockSearchParams.canceled = null;

      renderSelectPackagePage();

      await waitFor(() => {
        expect(screen.getByText('Select Package')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('Payment was canceled')
      ).not.toBeInTheDocument();
    });
  });

  describe('Page rendering', () => {
    it('should render package options', async () => {
      renderSelectPackagePage();

      await waitFor(() => {
        expect(screen.getByText('Rookie Pack')).toBeInTheDocument();
        expect(screen.getByText('Hero Pack')).toBeInTheDocument();
      });
    });
  });
});
