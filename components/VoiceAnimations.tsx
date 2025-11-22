'use client';

import React from 'react';

interface VoiceAnimationProps {
  state: 'listening' | 'processing' | 'speaking' | 'error' | 'idle';
}

export default function VoiceAnimations({ state }: VoiceAnimationProps) {
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
          <div className="microphone-container">
            <div className="microphone-body">
              <div className="microphone-top"></div>
              <div className="microphone-middle"></div>
              <div className="microphone-bottom"></div>
            </div>
            <div className="microphone-stand"></div>
            <div className="microphone-base"></div>
          </div>
          <div className="sound-wave wave-1"></div>
          <div className="sound-wave wave-2"></div>
          <div className="sound-wave wave-3"></div>
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
      {state === 'error' && (
         <div className="error-visual">⚠️</div>
      )}
    </div>
  );
}

