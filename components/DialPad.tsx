'use client';

import CartoonDialPad from './CartoonDialPad';

interface DialPadProps {
  onCorrectNumber?: () => void;
  targetNumber?: string;
  onBack?: () => void;
}

/**
 * Dial pad component with cartoon phone keyboard and number validation
 */
export default function DialPad({
  onCorrectNumber,
  targetNumber = '999',
  onBack,
}: DialPadProps) {
  return (
    <CartoonDialPad
      onCorrectNumber={onCorrectNumber}
      targetNumber={targetNumber}
      onBack={onBack}
    />
  );
}
