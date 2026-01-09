'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { isValidEmergencyNumber } from '@/lib/validation';
import { logger } from '@/lib/logger';

interface CartoonDialPadProps {
  onCorrectNumber?: () => void;
  targetNumber?: string;
  onBack?: () => void;
  autoStartConversation?: boolean;
  isLoading?: boolean;
  buttonLabel?: string;
}

// Maximum digits allowed (lets kids type more to ensure they get it right)
const MAX_INPUT_LENGTH = 6;

const DIAL_SOUNDS = [
  '/sfx/bttf-dial-1.mp3',
  '/sfx/bttf-dial-2.mp3',
  '/sfx/bttf-dial-3.mp3',
];

// Sound mapping for each key (1-9, *, 0, #)
const KEY_SOUNDS: Record<string, string> = {
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

// Phone keypad layout (standard phone layout)
const KEYPAD_BUTTONS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

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
    } else if (digit && input.length < MAX_INPUT_LENGTH) {
      // Add number (allow more digits than emergency number length)
      const newInput = input + digit;
      setInput(newInput);
      setHasError(false);
      setErrorMessage('');

      // Play sound
      playKeySound(digit);
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
        {/* Number Grid - Standard phone keypad layout */}
        {KEYPAD_BUTTONS.map((row, rowIndex) => (
          <div key={rowIndex} className="dial-keyboard-row">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleNumberClick(key)}
                className={`dial-key ${key === '*' || key === '#' ? 'dial-key-symbol' : ''}`}
                aria-label={key === '*' ? 'Star' : key === '#' ? 'Hash' : `Number ${key}`}
              >
                {key}
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
                const errorMsg = t('messages.dialNumber');
                setErrorMessage(errorMsg);
                setHasError(true);
                setTimeout(() => {
                  setHasError(false);
                  setErrorMessage('');
                }, 2500);
                return;
              }

              // Check if input is a valid emergency number (999 or 112 for UK)
              if (!isValidEmergencyNumber(input, emergencyNumber)) {
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
