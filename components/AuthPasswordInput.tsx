'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import AuthInput from '@/components/AuthInput';

interface AuthPasswordInputProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  errorId?: string;
  label: string;
  autoComplete?: string;
  autoFocus?: boolean;
  describedBy?: string;
  children?: ReactNode;
}

export default function AuthPasswordInput({
  id,
  placeholder,
  value,
  onChange,
  error,
  errorId,
  label,
  autoComplete,
  autoFocus,
  describedBy,
  children,
}: AuthPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthInput
      id={id}
      type="password"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      error={error}
      errorId={errorId}
      label={label}
      icon="lock"
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      describedBy={describedBy}
      showPasswordToggle
      showPassword={showPassword}
      onTogglePassword={() => setShowPassword(prev => !prev)}
    >
      {children}
    </AuthInput>
  );
}
