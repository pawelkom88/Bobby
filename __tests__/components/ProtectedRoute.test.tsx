import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// Mock next/navigation
const mockPush = vi.fn();
let mockPathname = '/en/app/chats';
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
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
  default: ({ text, heading }: { text?: string; heading?: string }) => (
    <div data-testid="loading-spinner">
      {heading && <span>{heading}</span>}
      {text && <span>{text}</span>}
    </div>
  ),
}));

// Import component after mocks
import ProtectedRoute from '@/components/ProtectedRoute';

const enMessages = {
  loading: {
    generic: 'Loading...',
    heading: 'Please wait',
  },
};

function renderProtectedRoute(
  children: React.ReactNode = <div>Protected Content</div>
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </NextIntlClientProvider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: { uid: 'test-user' },
      loading: false,
    };
    mockPathname = '/en/app/chats';
    mockSearchParams = new URLSearchParams();
  });

  describe('Access control', () => {
    it('should render children when user is authenticated', () => {
      mockAuthState.user = { uid: 'test-user' };

      renderProtectedRoute();

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', async () => {
      mockAuthState = {
        user: null as any,
        loading: false,
      };

      renderProtectedRoute();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login?redirect=%2Fen%2Fapp%2Fchats'
        );
      });
    });

    it('should preserve query params in redirect URL', async () => {
      mockAuthState = {
        user: null as any,
        loading: false,
      };
      mockSearchParams = new URLSearchParams('foo=bar&baz=qux');

      renderProtectedRoute();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          '/login?redirect=%2Fen%2Fapp%2Fchats%3Ffoo%3Dbar%26baz%3Dqux'
        );
      });
    });

    it('should not render children when not authenticated', () => {
      mockAuthState = {
        user: null as any,
        loading: false,
      };

      renderProtectedRoute();

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading spinner when auth is loading', () => {
      mockAuthState.loading = true;

      renderProtectedRoute();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should not show children during loading', () => {
      mockAuthState.loading = true;

      renderProtectedRoute();

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('should not redirect during loading', () => {
      mockAuthState.loading = true;
      mockAuthState.user = null as any;

      renderProtectedRoute();

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
