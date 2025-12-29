'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  className,
  children,
}: LogoutButtonProps) {
  const t = useTranslations('logoutButton');
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await signOut();
      router.push(ROUTES.LOGIN);
    } catch (error) {
      logger.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      aria-label={t('ariaLabel')}
    >
      <span>
        {children || (isLoggingOut ? t('signingOut') : t('signOut'))}
      </span>
    </button>
  );
}
