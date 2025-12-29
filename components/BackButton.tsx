'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
}

export default function BackButton({ className = '', onClick }: BackButtonProps) {
  const router = useRouter();
  const t = useTranslations('common');

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`back-button ${className}`}
      aria-label={t('back')}
    >
      {t('back')}
    </button>
  );
}
