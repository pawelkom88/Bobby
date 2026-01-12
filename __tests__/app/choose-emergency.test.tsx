import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { mockPush, mockClearSessionMutate } from '../utils/app-page-mocks';

const mockSetSelectedService = vi.fn().mockResolvedValue(undefined);
vi.mock('@/context/UserDataContext', () => ({
  useUserData: () => ({
    setSelectedService: mockSetSelectedService,
  }),
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
