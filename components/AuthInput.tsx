'use client';

import type { ReactNode, ChangeEvent } from 'react';

// SVG Icons as components
export function UserIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="login-input-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="5" fill="#A0A0B0" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" fill="#A0A0B0" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="login-input-icon"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#A0A0B0" />
      <path
        d="M8 11V7a4 4 0 018 0v4"
        stroke="#A0A0B0"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

interface AuthInputProps {
  id: string;
  type: 'email' | 'password' | 'text';
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  errorId?: string;
  label: string;
  icon: 'user' | 'lock';
  autoComplete?: string;
  autoFocus?: boolean;
  describedBy?: string;
  /** For password fields - toggle visibility button */
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  /** Additional content after the input (e.g., password strength) */
  children?: ReactNode;
}

/**
 * Reusable input component for auth forms with icon, label, and error handling.
 */
export default function AuthInput({
  id,
  type,
  placeholder,
  value,
  onChange,
  error,
  errorId,
  label,
  icon,
  autoComplete,
  autoFocus,
  describedBy,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  children,
}: AuthInputProps) {
  const Icon = icon === 'user' ? UserIcon : LockIcon;
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={type === 'password' ? 'login-password-group' : 'login-input-group'}>
      <div className={`login-input-container ${error ? 'login-input-error' : ''}`}>
        <Icon />
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="login-input"
          required
          aria-invalid={!!error}
          aria-describedby={error ? errorId : describedBy}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            className="login-password-toggle"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{ appearance: 'none' }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      {error && (
        <div id={errorId} className="login-error-message" role="alert">
          {error}
        </div>
      )}
      {children}
    </div>
  );
}

