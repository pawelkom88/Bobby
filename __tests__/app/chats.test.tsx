import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import ChatsPage from '../../app/[locale]/app/chats/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/en/app/chats',
}));

// Mock react ViewTransition
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock the useConversations hook
let mockConversationsState = {
  data: [] as unknown[],
  isLoading: false,
  error: null as Error | null,
};

vi.mock('@/hooks/queries/useConversations', () => ({
  useConversations: () => mockConversationsState,
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

vi.mock('@/components/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/ConversationList', () => ({
  default: ({
    conversations,
    isLoading,
    error,
  }: {
    conversations: unknown[];
    isLoading: boolean;
    error: string | null;
  }) => (
    <div data-testid="conversation-list">
      {isLoading && <span data-testid="loading">Loading...</span>}
      {error && <span data-testid="error">{error}</span>}
      {!isLoading && !error && (
        <span data-testid="conversations-count">
          {conversations.length} conversations
        </span>
      )}
    </div>
  ),
}));

vi.mock('@/components/SpeculationRules', () => ({
  SpeculationRules: () => null,
}));

// Import component after mocks

const enMessages = {
  chats: {
    title: 'Your Conversations',
    subtitle: 'Review your practice sessions',
    loadingError: 'Failed to load conversations',
  },
};

function renderChatsPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ChatsPage />
    </NextIntlClientProvider>
  );
}

describe('ChatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationsState = {
      data: [],
      isLoading: false,
      error: null,
    };
  });

  describe('Data fetching behavior with React Query', () => {
    it('should display loading state when query is loading', () => {
      mockConversationsState = {
        data: [],
        isLoading: true,
        error: null,
      };

      renderChatsPage();

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should display conversations after successful fetch', () => {
      mockConversationsState = {
        data: [
          { id: '1', title: 'Conversation 1' },
          { id: '2', title: 'Conversation 2' },
        ],
        isLoading: false,
        error: null,
      };

      renderChatsPage();

      expect(screen.getByTestId('conversations-count')).toHaveTextContent(
        '2 conversations'
      );
    });

    it('should display error when query fails', () => {
      mockConversationsState = {
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
      };

      renderChatsPage();

      expect(screen.getByTestId('error')).toHaveTextContent(
        'Failed to load conversations'
      );
    });

    it('should display empty state when no conversations', () => {
      mockConversationsState = {
        data: [],
        isLoading: false,
        error: null,
      };

      renderChatsPage();

      expect(screen.getByTestId('conversations-count')).toHaveTextContent(
        '0 conversations'
      );
    });
  });

  describe('Page rendering', () => {
    it('should render page title and subtitle', () => {
      renderChatsPage();

      expect(screen.getByText('Your Conversations')).toBeInTheDocument();
      expect(
        screen.getByText('Review your practice sessions')
      ).toBeInTheDocument();
    });
  });
});
