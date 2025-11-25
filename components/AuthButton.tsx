import React from 'react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function AuthButton({ children, className = '', ...props }: AuthButtonProps) {
  return (
    <button
      className={`ach-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
