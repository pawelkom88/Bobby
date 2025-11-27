'use client';

import React, { memo } from 'react';

interface CartoonTimerProps {
  remainingSeconds: number;
}

/**
 * CartoonTimer - Display-only timer component
 * Receives remainingSeconds from parent and displays formatted time
 * Uses memo to prevent unnecessary re-renders of parent components
 */
const CartoonTimer = memo(function CartoonTimer({
  remainingSeconds,
}: CartoonTimerProps) {
  const formatTime = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Determine if time is running low (under 30 seconds)
  const isLowTime = remainingSeconds <= 30;

  return (
    <div className="cartoon-timer-widget">
      <div className={`cartoon-timer-card ${isLowTime ? 'low-time' : ''}`}>
        <div className={`cartoon-timer-text ${isLowTime ? 'low-time' : ''}`}>
          {formatTime(remainingSeconds)}
        </div>
      </div>
    </div>
  );
});

export default CartoonTimer;
