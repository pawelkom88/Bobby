import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { vi } from 'vitest';
import CartoonDialPad from '../../components/CartoonDialPad';

// Mock audio
globalThis.Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  currentTime: 0,
  volume: 0.5,
})) as any;

const mockOnCorrectNumber = vi.fn();

// Test messages for English locale (matching actual translations)
const enMessages = {
  dial: {
    emergencyNumber: '999',
    title: 'Dial {number}',
    messages: {
      dialNumber: 'Please dial a number first! 📞',
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

  describe('Emergency number validation', () => {
    it('should accept 999 as valid emergency number', () => {
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

      if (callButton) fireEvent.click(callButton);

      // Should call onCorrectNumber since 999 is valid
      expect(mockOnCorrectNumber).toHaveBeenCalled();
    });

    it('should accept 112 as valid emergency number (UK alternative)', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Simulate dialing 112
      const buttons = screen.getAllByRole('button');
      const button1 = buttons.find(b => b.textContent === '1');
      const button2 = buttons.find(b => b.textContent === '2');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);
      if (button2) fireEvent.click(button2);

      if (callButton) fireEvent.click(callButton);

      // Should call onCorrectNumber since 112 is valid for UK
      expect(mockOnCorrectNumber).toHaveBeenCalled();
    });

    it('should show error for wrong number', () => {
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
      const errorBubble = screen.getByRole('alert');
      expect(errorBubble).toBeInTheDocument();
      expect(errorBubble).toHaveClass('error-bubble');
      // Should NOT call onCorrectNumber
      expect(mockOnCorrectNumber).not.toHaveBeenCalled();
    });

    it('should accept custom targetNumber prop', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} targetNumber="112" />
        </NextIntlClientProvider>
      );

      // Should use custom targetNumber, not locale default
      expect(screen.getByText('Dial 112')).toBeInTheDocument();

      // Dial 112
      const buttons = screen.getAllByRole('button');
      const button1 = buttons.find(b => b.textContent === '1');
      const button2 = buttons.find(b => b.textContent === '2');
      const callButton = buttons.find(b => b.textContent === 'CALL');

      if (button1) fireEvent.click(button1);
      if (button1) fireEvent.click(button1);
      if (button2) fireEvent.click(button2);

      if (callButton) fireEvent.click(callButton);

      // Should call onCorrectNumber since 112 is valid for targetNumber 112
      expect(mockOnCorrectNumber).toHaveBeenCalled();
    });
  });

  describe('Keypad layout', () => {
    it('should render all number buttons including * and #', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Check all number buttons exist
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: `Number ${i}` })).toBeInTheDocument();
      }
      // Check * and # buttons
      expect(screen.getByRole('button', { name: 'Star' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hash' })).toBeInTheDocument();
    });

    it('should allow typing more than 3 digits', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      // Dial 6 digits (max allowed)
      const buttons = screen.getAllByRole('button');
      const button9 = buttons.find(b => b.textContent === '9');

      // Click 6 times
      for (let i = 0; i < 6; i++) {
        if (button9) fireEvent.click(button9);
      }

      // Check display shows 6 digits
      expect(screen.getByText('999999')).toBeInTheDocument();
    });
  });

  describe('Empty input validation', () => {
    it('should show error when trying to call with no input', () => {
      render(
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <CartoonDialPad onCorrectNumber={mockOnCorrectNumber} />
        </NextIntlClientProvider>
      );

      const callButton = screen.getByRole('button', { name: 'Make call to Bobby' });

      // Call button should be disabled when no input
      expect(callButton).toBeDisabled();
    });
  });
});
