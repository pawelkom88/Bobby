import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { ReactNode } from 'react';

interface SuccessPageLayoutProps {
  children: ReactNode;
}

export default function SuccessPageLayout({
  children,
}: SuccessPageLayoutProps) {
  return (
    <div className="success-page">
      <div className="success-container">{children}</div>
    </div>
  );
}

interface SuccessContentProps {
  title: string;
  icon?: string;
  message?: string;
  email?: string;
  ctaText: string;
  ctaHref?: string;
  children?: ReactNode;
}

export function SuccessContent({
  title,
  icon,
  message,
  email,
  ctaText,
  ctaHref = `${ROUTES.DIAL}?fromSuccess=true`,
  children,
}: SuccessContentProps) {
  return (
    <>
      {icon && <div className="success-icon">{icon}</div>}
      <h1 className="success-title">{title}</h1>
      {message && <p className="success-message">{message}</p>}
      {email && <p className="success-email">{email}</p>}
      {children}
      <Link href={ctaHref} className="success-cta-button">
        {ctaText}
      </Link>
    </>
  );
}

interface SuccessDetailsProps {
  packType: string;
}

export function SuccessDetails({ packType }: SuccessDetailsProps) {
  const packClass = packType.toLowerCase();
  const displayName = packType.charAt(0).toUpperCase() + packType.slice(1);

  return (
    <div className={`success-details pack-${packClass}`}>
      <p>Pack: {displayName}</p>
    </div>
  );
}
