'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { validateEmergencyNumber } from '@/lib/validation';
import { logger } from '@/lib/logger';

interface CartoonDialPadProps {
  onCorrectNumber?: () => void;
  targetNumber?: string;
  onBack?: () => void;
  autoStartConversation?: boolean;
  isLoading?: boolean;
  buttonLabel?: string;
}

const CORRECT_NUMBER = '999'; // Fallback for non-translated contexts
// bttf-dial-1
// bttf-dial-2
// bttf-dial-3
const DIAL_SOUNDS = [
  '/sfx/bttf-dial-1.mp3',
  '/sfx/bttf-dial-2.mp3',
  '/sfx/bttf-dial-3.mp3',
];

// Sound mapping for each key (1-9, *, 0, #)
const KEY_SOUNDS = {
  '1': DIAL_SOUNDS[0],
  '2': DIAL_SOUNDS[1],
  '3': DIAL_SOUNDS[2],
  '4': DIAL_SOUNDS[0],
  '5': DIAL_SOUNDS[1],
  '6': DIAL_SOUNDS[2],
  '7': DIAL_SOUNDS[0],
  '8': DIAL_SOUNDS[1],
  '9': DIAL_SOUNDS[2],
  '*': DIAL_SOUNDS[0],
  '0': DIAL_SOUNDS[1],
  '#': DIAL_SOUNDS[2],
};

const FUNNY_ERROR_MESSAGES = [
  "Oops! That's not quite right!",
  'Hmm, try again friend!',
  'Nice try! Almost there!',
  'Whoopsie-daisy! Give it another go!',
  'Not this time! You got this!',
  "Close, but let's try again!",
  "Keep trying, you're doing great!",
  "That wasn't it, but I believe in you!",
];

export default function CartoonDialPad({
  onCorrectNumber,
  targetNumber,
  onBack,
  isLoading = false,
  buttonLabel = 'CALL',
}: CartoonDialPadProps) {
  const t = useTranslations('dial');
  // Use locale-specific emergency number if no targetNumber provided
  const emergencyNumber = targetNumber || t('emergencyNumber');
  const [input, setInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isWrongNumber, setIsWrongNumber] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playKeySound = (digit: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const soundUrl = KEY_SOUNDS[digit as keyof typeof KEY_SOUNDS];
      if (soundUrl) {
        audioRef.current = new Audio(soundUrl);
        audioRef.current.volume = 0.5;
        void audioRef.current.play();
      }
    } catch (error) {
      logger.error('Error playing sound:', error);
    }
  };

  const handleNumberClick = (digit: string) => {
    if (digit === '⌫') {
      // Backspace
      setInput(prev => prev.slice(0, -1));
      setHasError(false);
      setErrorMessage('');
    } else if (digit && input.length < emergencyNumber.length) {
      // Add number
      const newInput = input + digit;
      setInput(newInput);
      setHasError(false);
      setErrorMessage('');

      // Play sound
      playKeySound(digit);
      // No auto-trigger - user must click CALL button
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const key = event.key;
    if (key >= '0' && key <= '9') {
      handleNumberClick(key);
    } else if (key === 'Backspace') {
      handleNumberClick('⌫');
    } else if (key === '*' || key === '#') {
      handleNumberClick(key);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyPress as EventListener);
    };
  }, [input]);

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '0', '9'],
  ];

  return (
    <div className="dial-container">
      {hasError && (
        <div className="error-bubble" role="alert" aria-live="polite">
          <div className="bubble-content">{errorMessage}</div>
          <div className="bubble-tail"></div>
        </div>
      )}

      <div>
        {/* Heading */}
        <h1 className="dial-heading">{t('title', { number: emergencyNumber })}</h1>

        {/* Number display */}
        <div
          className={`dial-display ${!input ? 'empty' : ''} ${isWrongNumber ? 'wrong-number' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {input || '___'}
        </div>
        {/* Number Grid */}
        {buttons.map((row, rowIndex) => (
          <div key={rowIndex} className="dial-keyboard-row">
            {row.map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="dial-key"
                aria-label={`Number ${num}`}
              >
                {num}
              </button>
            ))}
          </div>
        ))}

        {/* Action buttons */}
        <div className="dial-actions">
          <button
            onClick={() => {
              // Validate the number is correct
              if (!input) {
                // Show error if no number dialed
                const errorMsg = t('messages.dialNumber');
                setErrorMessage(errorMsg);
                setHasError(true);
                setTimeout(() => {
                  setHasError(false);
                  setErrorMessage('');
                }, 2500);
                return;
              }

              if (input.length !== emergencyNumber.length) {
                // Show error if incomplete number
                const errorMsg = t('messages.dialAllDigits', { count: emergencyNumber.length });
                setErrorMessage(errorMsg);
                setHasError(true);
                setTimeout(() => {
                  setHasError(false);
                  setErrorMessage('');
                }, 2500);
                return;
              }

              if (!validateEmergencyNumber(input, emergencyNumber)) {
                // Show error if wrong number
                const randomMessage =
                  FUNNY_ERROR_MESSAGES[
                    Math.floor(Math.random() * FUNNY_ERROR_MESSAGES.length)
                  ];
                setErrorMessage(randomMessage);
                setHasError(true);
                setIsWrongNumber(true);
                setTimeout(() => {
                  setInput('');
                  setHasError(false);
                  setErrorMessage('');
                  setIsWrongNumber(false);
                }, 2500);
                return;
              }

              // Call is correct - proceed to Bobby
              if (onCorrectNumber) {
                onCorrectNumber();
              }
            }}
            className="dial-call-btn"
            disabled={input.length === 0 || isLoading}
            aria-label="Make call to Bobby"
          >
            <span>{isLoading ? 'Loading...' : buttonLabel}</span>
          </button>
          <button
            onClick={() => {
              setInput('');
              setHasError(false);
              setErrorMessage('');
              setIsWrongNumber(false);
            }}
            className="dial-clear-btn"
            aria-label="Clear display"
          >
            <span>{t('buttons.clear')}</span>
          </button>
        </div>
      </div>

      {onBack && (
        <div className="dial-back-button">
          <button
            type="button"
            className="cartoon-btn"
            onClick={onBack}
            aria-label="Go back to emergency selection"
          >
            <span>{t('buttons.back')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
