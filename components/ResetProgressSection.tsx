'use client';

import { useState } from 'react';
import CartoonButton from '@/components/CartoonButton';
import { useUserData } from '@/context/UserDataContext';
import { logger } from '@/lib/logger';

export default function ResetProgressSection() {
  const { resetProgress } = useUserData();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleReset = async () => {
    if (showConfirm) {
      try {
        await resetProgress();
        setShowConfirm(false);
        setConfirmed(true);
      } catch (error) {
        logger.error('Error resetting progress:', error);
      }
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (!showConfirm) {
    return (
      <div className="progress-section">
        <p>Reset all progress, badges, and conversation history.</p>
        <CartoonButton
          onClick={handleReset}
          ariaLabel="Reset progress"
          className="cartoon-btn-danger"
        >
          💣 Reset Progress
        </CartoonButton>
        {confirmed && (
          <p className="reset-confirmation" role="alert">
            Progress reset successfully.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="reset-warning" role="alert">
        Are you sure you want to reset all progress? This cannot be undone.
      </p>
      <div className="reset-actions">
        <CartoonButton
          onClick={handleReset}
          ariaLabel="Confirm reset progress"
          className="cartoon-btn-danger"
        >
          Yes, Reset Everything
        </CartoonButton>
        <CartoonButton onClick={handleCancel} ariaLabel="Cancel reset">
          Cancel
        </CartoonButton>
      </div>
    </>
  );
}

