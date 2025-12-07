'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

interface AuthPageLayoutProps {
  children: ReactNode;
  titleId?: string;
}

export default function AuthPageLayout({
  children,
  titleId,
}: AuthPageLayoutProps) {
  return (
    <div className="login-page">
      <div className="login-sparkle" aria-hidden="true" />
      <div className="login-container" role="main" aria-labelledby={titleId}>
        {children}
      </div>
    </div>
  );
}

interface AuthPageHeaderProps {
  title: string;
  titleId?: string;
  description?: string;
  descriptionId?: string;
}

/**
 * Header section with Bobby image and title.
 */
export function AuthPageHeader({
  title,
  titleId = 'auth-title',
  description,
  descriptionId,
}: AuthPageHeaderProps) {
  return (
    <>
      <Image
        src="/login-bobby.png"
        alt="Bobby Logo"
        width={200}
        height={200}
        className="login-character"
      />
      <h1 id={titleId} className="login-title">
        {title}
      </h1>
      {description && (
        <p id={descriptionId} className="login-description">
          {description}
        </p>
      )}
    </>
  );
}

interface AuthErrorMessageProps {
  error?: string;
  style?: React.CSSProperties;
}

/**
 * General error message display for auth forms.
 */
export function AuthErrorMessage({ error, style }: AuthErrorMessageProps) {
  if (!error) return null;

  return (
    <div
      className="reset-warning"
      role="alert"
      style={{ marginBottom: '20px', textAlign: 'center', ...style }}
    >
      {error}
    </div>
  );
}

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthFooterLink({ text, linkText, href }: AuthFooterLinkProps) {
  return (
    <div className="login-signup">
      {text}{' '}
      <a href={href} className="login-signup-link">
        {linkText}
      </a>
    </div>
  );
}
