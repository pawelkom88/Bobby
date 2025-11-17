'use client';

import { useState, useEffect, useRef } from 'react';
import { validateEmergencyNumber } from '@/lib/validation';

interface CartoonDialPadProps {
  onCorrectNumber?: () => void;
  targetNumber?: string;
  onBack?: () => void;
  autoStartConversation?: boolean;
}

const CORRECT_NUMBER = '999';
const DIAL_SOUNDS = [
  'https://cdn.josetxu.com/audio/bttf-dial-1.mp3',
  'https://cdn.josetxu.com/audio/bttf-dial-2.mp3',
  'https://cdn.josetxu.com/audio/bttf-dial-3.mp3',
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
  "Oops! That's not quite right! 😅",
  "Hmm, try again friend! 🤔",
  "Nice try! Almost there! 💪",
  "Whoopsie-daisy! Give it another go! 🎉",
  "Not this time! You got this! ⭐",
  "Close, but let's try again! 🚀",
  "Keep trying, you're doing great! 🌟",
  "That wasn't it, but I believe in you! 💖",
];

export default function CartoonDialPad({
  onCorrectNumber,
  targetNumber = CORRECT_NUMBER,
  onBack,
}: CartoonDialPadProps) {
  const [input, setInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
      console.error('Error playing sound:', error);
    }
  };

  const handleNumberClick = (digit: string) => {
    if (digit === '⌫') {
      // Backspace
      setInput((prev) => prev.slice(0, -1));
      setHasError(false);
      setErrorMessage('');
    } else if (digit && input.length < targetNumber.length) {
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

  const displayValue = input || '___';

  return (
    <div className="cartoon-dial-pad">
      {/* Error Speech Bubble */}
      {hasError && (
        <div className="error-bubble" role="alert" aria-live="polite">
          <div className="bubble-content">{errorMessage}</div>
          <div className="bubble-tail"></div>
        </div>
      )}

      <div className="dial-pad-header">
        <div className="dial-pad-title-section">
          <h2 className="dial-pad-title">WHAT NUMBER?</h2>
          {onBack && (
            <button
              type="button"
              className="back-button"
              onClick={onBack}
              aria-label="Go back to situation selection"
            >
              ← Back
            </button>
          )}
        </div>
        <p className="dial-pad-subtitle">Dial {targetNumber} to start</p>
      </div>

      <div className="phone-container">
        <div className="phone">
          <div className="display" aria-live="polite" aria-atomic="true">
            {displayValue}
          </div>

          <div className="keyboard">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(
              (num, index) => {
                const letterMap: Record<string, string> = {
                  '1': '',
                  '2': 'ABC',
                  '3': 'DEF',
                  '4': 'GHI',
                  '5': 'JKL',
                  '6': 'MNO',
                  '7': 'PQRS',
                  '8': 'TUV',
                  '9': 'WXYZ',
                  '*': '',
                  '0': '+',
                  '#': '',
                };

                const keyClass =
                  num === '*'
                    ? 'key star'
                    : num === '#'
                      ? 'key hash'
                      : num === '0'
                        ? 'key zero'
                        : 'key';

                return (
                  <button
                    key={`${num}-${index}`}
                    type="button"
                    className={keyClass}
                    onClick={() => handleNumberClick(num)}
                    aria-label={`Number ${num}`}
                  >
                    {num}
                    {letterMap[num] && (
                      <div className="letters">{letterMap[num]}</div>
                    )}
                  </button>
                );
              }
            )}
          </div>

          <div className="actions">
            <button
              type="button"
              className="action-btn call-btn"
              onClick={() => {
                // Validate the number is correct
                if (!input) {
                  // Show error if no number dialed
                  const errorMsg = "Please dial a number first! 📞";
                  setErrorMessage(errorMsg);
                  setHasError(true);
                  setTimeout(() => {
                    setHasError(false);
                    setErrorMessage('');
                  }, 2500);
                  return;
                }
                
                if (input.length !== targetNumber.length) {
                  // Show error if incomplete number
                  const errorMsg = `Please dial all ${targetNumber.length} digits! 🔢`;
                  setErrorMessage(errorMsg);
                  setHasError(true);
                  setTimeout(() => {
                    setHasError(false);
                    setErrorMessage('');
                  }, 2500);
                  return;
                }
                
                if (!validateEmergencyNumber(input, targetNumber)) {
                  // Show error if wrong number
                  const randomMessage =
                    FUNNY_ERROR_MESSAGES[
                      Math.floor(Math.random() * FUNNY_ERROR_MESSAGES.length)
                    ];
                  setErrorMessage(randomMessage);
                  setHasError(true);
                  setTimeout(() => {
                    setInput('');
                    setHasError(false);
                    setErrorMessage('');
                  }, 2500);
                  return;
                }
                
                // Call is correct - proceed to Bobby
                if (onCorrectNumber) {
                  onCorrectNumber();
                }
              }}
              aria-label="Make call to Bobby"
              disabled={input.length === 0}
            >
              📞 CALL
            </button>
            <button
              type="button"
              className="action-btn clear-btn"
              onClick={() => {
                setInput('');
                setHasError(false);
                setErrorMessage('');
              }}
              aria-label="Clear display"
            >
              ✕ CLEAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

