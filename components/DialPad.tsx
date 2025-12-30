'use client';

import CartoonDialPad from './CartoonDialPad';

interface DialPadProps {
  onCorrectNumber?: () => void;
  targetNumber?: string;
  onBack?: () => void;
  isLoading?: boolean;
  buttonLabel?: string;
}

/**
 * Dial pad component with cartoon phone keyboard and number validation
 */
export default function DialPad({
  onCorrectNumber,
  targetNumber,
  onBack,
  isLoading,
  buttonLabel,
}: DialPadProps) {
  return (
    <CartoonDialPad
      onCorrectNumber={onCorrectNumber}
      targetNumber={targetNumber}
      onBack={onBack}
      isLoading={isLoading}
      buttonLabel={buttonLabel}
    />
  );
}
