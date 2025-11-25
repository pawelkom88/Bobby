'use client';

import { useState } from 'react';

interface TimerDisplayProps {
  remainingSeconds: number;
  onExpire?: () => void;
}

/**
 * Format seconds into MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TimerDisplay({
  remainingSeconds,
  onExpire,
}: TimerDisplayProps) {
  const formattedTime = formatTime(remainingSeconds);

  return (
    <div
      className="timer-container"
      role="button"
      tabIndex={0}
      aria-label={`Time remaining: ${formattedTime}`}
    >
      <div className="timer-icon">⏱️</div>
      <div className="timer-expanded">
        <span className="timer-time">{formattedTime}</span>
      </div>
    </div>
  );
}
