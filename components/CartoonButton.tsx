'use client';

import React from 'react';

interface CartoonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
}

/**
 * Cartoon styled button with 3D perspective effect
 * Wraps button text in <span> for proper 3D transform
 */
export default function CartoonButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ariaLabel,
  title,
}: CartoonButtonProps) {
  return (
    <div className="btn-container">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`cartoon-btn ${className}`}
        aria-label={ariaLabel}
        title={title}
      >
        <span>{children}</span>
      </button>
    </div>
  );
}

