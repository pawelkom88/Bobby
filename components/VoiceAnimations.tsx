import React, { memo } from 'react';

interface VoiceAnimationProps {
  state: 'listening' | 'processing' | 'speaking' | 'error' | 'idle';
}

const VoiceAnimations = memo(function VoiceAnimations({ state }: VoiceAnimationProps) {
  return (
    <div className="voice-animations-container">
      {/* AI Speaking State - Waveform */}
      {state === 'speaking' && (
        <div className="ai-speaking-visual">
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
          <div className="waveform-bar"></div>
        </div>
      )}

      {/* User Listening State - Animated Microphone */}
      {state === 'listening' && (
        <div className="user-listening-visual">
          <div className="mic-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>
      )}

      {/* Processing State - Thinking Bubbles/Spinner */}
      {state === 'processing' && (
        <div className="processing-visual">
          <div className="thinking-bubble"></div>
          <div className="thinking-bubble delay-1"></div>
          <div className="thinking-bubble delay-2"></div>
        </div>
      )}

      {/* Error/Idle States could be simpler or empty */}
      {state === 'error' && <div className="error-visual">⚠️</div>}
    </div>
  );
});

export default VoiceAnimations;
