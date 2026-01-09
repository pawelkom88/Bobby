import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
}));

// Credits state
let mockCreditsState = {
  credits: 5,
  hasCredits: true,
  loading: false,
  isInitialized: true,
  isServerConfirmed: true,
  conversationActive: false,
};

vi.mock('@/context/CreditsContext', () => ({
  useCredits: () => mockCreditsState,
}));

// Auth state
let mockAuthState = {
  user: { uid: 'test-user' },
  loading: false,
};

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="loading-spinner">{text}</div>
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Import component after mocks
import PaidRouteGuard from '@/components/PaidRouteGuard';

const enMessages = {
  paidRouteGuard: {
    verifyingAccess: 'Verifying access...',
    redirecting: 'Redirecting...',
  },
};

function renderPaidRouteGuard(children: React.ReactNode = <div>Protected Content</div>) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <PaidRouteGuard>{children}</PaidRouteGuard>
    </NextIntlClientProvider>
  );
}

describe('PaidRouteGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreditsState = {
      credits: 5,
      hasCredits: true,
      loading: false,
      isInitialized: true,
      isServerConfirmed: true,
      conversationActive: false,
    };
    mockAuthState = {
      user: { uid: 'test-user' },
      loading: false,
    };
  });

  describe('Access control', () => {
    it('should render children when user has credits', async () => {
      mockCreditsState.hasCredits = true;

      renderPaidRouteGuard();

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should redirect to dial when user has no credits', async () => {
      mockCreditsState.hasCredits = false;
      mockCreditsState.credits = 0;

      renderPaidRouteGuard();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/app/dial?needsCredits=true');
      });
    });

    it('should redirect to login when user is not authenticated', async () => {
      mockAuthState = {
        user: null as any,
        loading: false,
      };

      renderPaidRouteGuard();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('should allow access when conversation is active even with 0 credits', async () => {
      mockCreditsState.hasCredits = false;
      mockCreditsState.credits = 0;
      mockCreditsState.conversationActive = true;

      renderPaidRouteGuard();

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Loading states', () => {
    it('should show loading spinner when auth is loading', () => {
      mockAuthState.loading = true;

      renderPaidRouteGuard();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading spinner when credits are loading', () => {
      mockCreditsState.loading = true;

      renderPaidRouteGuard();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading spinner when not initialized', () => {
      mockCreditsState.isInitialized = false;

      renderPaidRouteGuard();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show loading spinner when not server confirmed', () => {
      mockCreditsState.isServerConfirmed = false;

      renderPaidRouteGuard();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show redirecting state when access denied', async () => {
      mockCreditsState.hasCredits = false;
      mockCreditsState.credits = 0;

      renderPaidRouteGuard();

      await waitFor(() => {
        expect(screen.getByText('Redirecting...')).toBeInTheDocument();
      });
    });
  });
});
