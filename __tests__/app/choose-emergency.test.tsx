import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
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

// Mock session mutation
const mockClearSessionMutate = vi.fn();
vi.mock('@/hooks/mutations/useSessionMutations', () => ({
  useClearSession: () => ({
    mutate: mockClearSessionMutate,
    isPending: false,
    isSuccess: false,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false,
  }),
}));

const mockSetSelectedService = vi.fn().mockResolvedValue(undefined);
vi.mock('@/context/UserDataContext', () => ({
  useUserData: () => ({
    setSelectedService: mockSetSelectedService,
  }),
}));

// Mock components
vi.mock('@/components/PageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-wrapper">{children}</div>
  ),
}));

vi.mock('@/components/CartoonButton', () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/SpeculationRules', () => ({
  SpeculationRules: () => null,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Import component after mocks
import ChooseEmergencyPage from '@/app/[locale]/app/choose-emergency/page';

const enMessages = {
  chooseEmergency: {
    title: 'Choose Emergency Type',
    subtitle: 'Select the type of emergency',
    services: {
      fire: 'Fire',
      ambulance: 'Ambulance',
      police: 'Police',
    },
  },
  common: {
    back: 'Back',
  },
};

function renderChooseEmergencyPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ChooseEmergencyPage />
    </NextIntlClientProvider>
  );
}

describe('ChooseEmergencyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session clearing behavior', () => {
    it('should clear session once on mount for authenticated user', async () => {
      renderChooseEmergencyPage();

      await waitFor(() => {
        expect(mockClearSessionMutate).toHaveBeenCalledTimes(1);
      });
    });

    it('should not clear session multiple times on re-renders', async () => {
      const { rerender } = renderChooseEmergencyPage();

      await waitFor(() => {
        expect(mockClearSessionMutate).toHaveBeenCalledTimes(1);
      });

      // Re-render multiple times
      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <ChooseEmergencyPage />
        </NextIntlClientProvider>
      );

      rerender(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <ChooseEmergencyPage />
        </NextIntlClientProvider>
      );

      // Should still only be called once
      expect(mockClearSessionMutate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Page rendering', () => {
    it('should render page title and subtitle', () => {
      renderChooseEmergencyPage();

      expect(screen.getByText('Choose Emergency Type')).toBeInTheDocument();
      expect(
        screen.getByText('Select the type of emergency')
      ).toBeInTheDocument();
    });

    it('should render all emergency type options', () => {
      renderChooseEmergencyPage();

      expect(screen.getByLabelText('Select Fire')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Ambulance')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Police')).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderChooseEmergencyPage();

      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Service selection', () => {
    it('should call setSelectedService and navigate when service is selected', async () => {
      renderChooseEmergencyPage();

      const fireButton = screen.getByLabelText('Select Fire');
      fireEvent.click(fireButton);

      await waitFor(() => {
        expect(mockSetSelectedService).toHaveBeenCalledWith('fire');
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/app/select-package');
      });
    });
  });
});
