import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { vi } from 'vitest';
import CartoonDialPad from '../../components/CartoonDialPad';
import { validateEmergencyNumber } from '../../lib/validation';

// Mock the validation function
vi.mock('../../lib/validation', () => ({
  validateEmergencyNumber: vi.fn(),
}));

// Mock audio
global.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  currentTime: 0,
  volume: 0.5,
})) as any;

const mockOnCorrectNumber = vi.fn();

// Test messages for different locales
const enMessages = {
  dial: {
    emergencyNumber: '999',
    title: 'Dial {number}',
    messages: {
      dialNumber: 'Please dial a number first! 📞',
      dialAllDigits: 'Please dial all {count} digits! 🔢',
    },
    buttons: {
      clear: 'CLEAR',
    },
  },
};

const plMessages = {
  dial: {
    emergencyNumber: '112',
    title: 'Wybierz numer {number}',
    messages: {
      dialNumber: 'Wybierz numer! 📞',
      dialAllDigits: 'Wybierz wszystkie {count} cyfry! 🔢',
    },
    buttons: {
      clear: 'CLEAR',
    },
  },
};

describe('CartoonDialPad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Locale-specific emergency numbers', () => {
    it('should use 999 as emergency number for English locale', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Check the title displays the correct number
      expect(screen.getByText('Dial 999')).toBeInTheDocument();

      // Simulate dialing 999
      const buttons = screen.getAllByRole('button');
      const button9 = buttons.find(b => b.textContent === '9');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button9) fireEvent.click(button9);
      if (button9) fireEvent.click(button9);
      if (button9) fireEvent.click(button9);

      // Mock validation to return true
      (validateEmergencyNumber as ReturnType<typeof vi.fn>).mockReturnValue(true);

      if (callButton) fireEvent.click(callButton);

      // Should validate against 999
      expect(validateEmergencyNumber).toHaveBeenCalledWith('999', '999');
    });

    it('should use 112 as emergency number for Polish locale', () => {
      render(
        <NextIntlClientProvider locale="pl" messages={plMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Check the title displays the correct number
      expect(screen.getByText('Wybierz numer 112')).toBeInTheDocument();

      // Simulate dialing 112
      const buttons = screen.getAllByRole('button');
      const button1 = buttons.find(b => b.textContent === '1');
      const button2 = buttons.find(b => b.textContent === '2');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);
      if (button2) fireEvent.click(button2);

      // Mock validation to return true
      (validateEmergencyNumber as ReturnType<typeof vi.fn>).mockReturnValue(true);

      if (callButton) fireEvent.click(callButton);

      // Should validate against 112
      expect(validateEmergencyNumber).toHaveBeenCalledWith('112', '112');
    });

    it('should show error for wrong number in English locale', () => {
      (validateEmergencyNumber as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Dial wrong number (111)
      const buttons = screen.getAllByRole('button');
      const button1 = buttons.find(b => b.textContent === '1');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);

      if (callButton) fireEvent.click(callButton);

      // Should show error
      expect(validateEmergencyNumber).toHaveBeenCalledWith('111', '999');
      // Check that error bubble is displayed
      const errorBubble = screen.getByRole('alert');
      expect(errorBubble).toBeInTheDocument();
      expect(errorBubble).toHaveClass('error-bubble');
    });

    it('should show error for wrong number in Polish locale', () => {
      (validateEmergencyNumber as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(
        <NextIntlClientProvider locale="pl" messages={plMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Dial wrong number (999 instead of 112)
      const buttons = screen.getAllByRole('button');
      const button9 = buttons.find(b => b.textContent === '9');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button9) fireEvent.click(button9);
      if (button9) fireEvent.click(button9);
      if (button9) fireEvent.click(button9);

      if (callButton) fireEvent.click(callButton);

      // Should show error
      expect(validateEmergencyNumber).toHaveBeenCalledWith('999', '112');
      // Check that error bubble is displayed
      const errorBubble = screen.getByRole('alert');
      expect(errorBubble).toBeInTheDocument();
      expect(errorBubble).toHaveClass('error-bubble');
    });

    it('should accept custom targetNumber prop regardless of locale', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} targetNumber="911" />
        </NextIntlClientProvider>
      );

      // Should use custom targetNumber, not locale default
      expect(screen.getByText('Dial 911')).toBeInTheDocument();

      // Mock validation to return true
      (validateEmergencyNumber as ReturnType<typeof vi.fn>).mockReturnValue(true);

      // Dial 911
      const buttons = screen.getAllByRole('button');
      const button9 = buttons.find(b => b.textContent === '9');
      const button1 = buttons.find(b => b.textContent === '1');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button9) fireEvent.click(button9);
      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);

      if (callButton) fireEvent.click(callButton);

      // Should validate against custom targetNumber
      expect(validateEmergencyNumber).toHaveBeenCalledWith('911', '911');
    });
  });

  describe('Validation messages', () => {
    it('should show incomplete number message with correct digit count for English', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Dial only 2 digits (need 3 for 999)
      const buttons = screen.getAllByRole('button');
      const button9 = buttons.find(b => b.textContent === '9');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button9) fireEvent.click(button9);
      if (button9) fireEvent.click(button9);

      if (callButton) fireEvent.click(callButton);

      expect(screen.getByText('Please dial all 3 digits! 🔢')).toBeInTheDocument();
    });

    it('should show incomplete number message with correct digit count for Polish', () => {
      render(
        <NextIntlClientProvider locale="pl" messages={plMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Dial only 2 digits (need 3 for 112)
      const buttons = screen.getAllByRole('button');
      const button1 = buttons.find(b => b.textContent === '1');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);

      if (callButton) fireEvent.click(callButton);

      expect(screen.getByText('Wybierz wszystkie 3 cyfry! 🔢')).toBeInTheDocument();
    });
  });
});
