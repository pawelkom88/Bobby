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

/**
 * Minimized timer that expands on hover/click to show remaining time
 */
export default function TimerDisplay({ remainingSeconds, onExpire }: TimerDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedTime = formatTime(remainingSeconds);

  return (
    <div 
      className="timer-container"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      aria-label={`Time remaining: ${formattedTime}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsExpanded(!isExpanded);
        }
      }}
    >
      {/* Clock Icon - Always Visible */}
      <div className="timer-icon">
        ⏱️
      </div>

      {/* Expanded Time Display - Shows on Hover/Click */}
      {isExpanded && (
        <div className="timer-expanded">
          <span className="timer-time">{formattedTime}</span>
        </div>
      )}
    </div>
  );
}

