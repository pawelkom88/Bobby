'use client';

import { useState, useEffect, useRef } from 'react';
import { validateEmergencyNumber } from '@/lib/validation';
import {logger} from "@/lib/logger";

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
      logger.error('Error playing sound:', error);
    }
  };

  const handleNumberClick = (digit: string) => {
    if (digit === '⌫') {
      // Backspace
      setInput(prev => prev.slice(0, -1));
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
      {hasError && (
        <div className="error-bubble" role="alert" aria-live="polite">
          <div className="bubble-content">{errorMessage}</div>
          <div className="bubble-tail"></div>
        </div>
      )}

      <h2 className="dial-pad-subtitle">Dial {targetNumber} to start</h2>

      <div className="phone-container">
        <div className="phone">
          <div className="display" aria-live="polite" aria-atomic="true">
            {displayValue}
          </div>

          <div className="keyboard">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(
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
                  const errorMsg = 'Please dial a number first! 📞';
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                style={{ width: '20px', height: '20px' }}
              >
                <path d="M511.2 387l-23.25 100.8c-3.266 14.25-15.79 24.22-30.46 24.22C205.2 512 0 306.8 0 54.5c0-14.66 9.969-27.2 24.22-30.45l100.8-23.25C139.7-2.602 154.7 5.018 160.8 18.92l46.52 108.5c5.438 12.78 1.77 27.67-8.98 36.45L144.5 207.1c33.98 69.22 90.26 125.5 159.5 159.5l44.08-53.8c8.688-10.78 23.69-14.51 36.47-8.975l108.5 46.51C506.1 357.2 514.6 372.4 511.2 387z"></path>
              </svg>
              <span>CALL</span>
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
              <svg
                fill="#000000"
                height="16px"
                width="16px"
                version="1.1"
                id="Capa_1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 460.775 460.775"
              >
                <path
                  d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55
	c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55
	c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505
	c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55
	l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719
	c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"
                />
              </svg>
              <span>CLEAR</span>
            </button>
          </div>
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
            <span>BACK</span>
          </button>
        </div>
      )}
    </div>
  );
}
