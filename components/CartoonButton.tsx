'use client';

import React from 'react';
import Link from 'next/link';

interface CartoonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
  asLink?: boolean;
  href?: string;
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
  asLink = false,
  href = '',
}: CartoonButtonProps) {
  return (
    <div className="btn-container">
      {asLink ? (
        <Link href={href} className="cartoon-btn">
          <span>{children}</span>
        </Link>
      ) : (
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
    )}
    </div>
  );
}

