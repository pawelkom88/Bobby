'use client';

import { useState, useEffect } from 'react';
import { validateEmergencyNumber } from '@/lib/validation';
import { useSound } from './SoundProvider';
import { playUiClick } from '@/lib/uiSound';

const CORRECT_NUMBER = '999';
const NUMBER_PAD: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

interface DialPadProps {
  onCorrectNumber?: () => void;
  targetNumber?: string;
}

/**
 * Dial pad component with large keyboard and number validation
 */
export default function DialPad({ onCorrectNumber, targetNumber = CORRECT_NUMBER }: DialPadProps) {
  const [input, setInput] = useState('');
  const [hasError, setHasError] = useState(false);
  const { soundEnabled } = useSound();

  useEffect(() => {
    // Clear error when user starts typing again
    if (input.length > 0 && hasError) {
      setHasError(false);
    }
  }, [input, hasError]);

  const handleNumberClick = (value: string) => {
    // UI click sound for any non-empty key (numbers and backspace)
    if (value) {
      void playUiClick(soundEnabled);
    }
    if (value === '⌫') {
      // Backspace
      setInput((prev) => prev.slice(0, -1));
      setHasError(false);
    } else if (value && input.length < targetNumber.length) {
      // Add number
      const newInput = input + value;
      setInput(newInput);
      setHasError(false);
      
      // Check if complete and correct
      if (newInput.length === targetNumber.length) {
        if (validateEmergencyNumber(newInput, targetNumber)) {
          // Correct number
          if (onCorrectNumber) {
            onCorrectNumber();
          }
        } else {
          // Incorrect number
          setHasError(true);
          // Clear after showing error
          setTimeout(() => {
            setInput('');
            setHasError(false);
          }, 2000);
        }
      }
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const key = event.key;
    if (key >= '0' && key <= '9') {
      handleNumberClick(key);
    } else if (key === 'Backspace') {
      handleNumberClick('⌫');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyPress as EventListener);
    };
  }, [input]);

  return (
    <div className="dial-pad" role="application" aria-label="Emergency number dial pad">
      <h2 className="dial-pad-title">WHAT NUMBER?</h2>
      <p className="dial-pad-subtitle">Dial {targetNumber} to start</p>
      
      <div className="dial-display" aria-live="polite" aria-atomic="true">
        <div className={`dial-number ${hasError ? 'error' : ''}`}>
          {input || '___'}
        </div>
        {hasError && (
          <p className="dial-error-message" role="alert">
            That's not quite right. Try again!
          </p>
        )}
      </div>
      
      <div className={`number-pad ${hasError ? 'error-state' : ''}`}>
        {NUMBER_PAD.map((row, rowIndex) => (
          <div key={rowIndex} className="number-pad-row">
            {row.map((num, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                className={`number-button ${num === '' ? 'empty' : ''}`}
                onClick={() => handleNumberClick(num)}
                disabled={num === ''}
                aria-label={num === '⌫' ? 'Backspace' : num === '' ? '' : `Number ${num}`}
              >
                {num}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

