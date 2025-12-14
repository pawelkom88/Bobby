'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import CartoonButton from '@/components/CartoonButton';
import { useUserData } from '@/context/UserDataContext';
import { logger } from '@/lib/logger';

export default function ResetProgressSection() {
  const t = useTranslations('resetProgress');
  const { resetProgress } = useUserData();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleReset = async () => {
    if (showConfirm) {
      try {
        await resetProgress();
        setShowConfirm(false);
        setConfirmed(true);
      } catch (error) {
        logger.error('Error resetting progress:', error);
      }
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (!showConfirm) {
    return (
      <div className="progress-section">
        <p>{t('description')}</p>
        <CartoonButton
          onClick={handleReset}
          ariaLabel={t('button')}
          className="cartoon-btn-danger"
        >
          💣 {t('button')}
        </CartoonButton>
        {confirmed && (
          <p className="reset-confirmation" role="alert">
            {t('success')}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <p className="reset-warning" role="alert">
        {t('confirmMessage')}
      </p>
      <div className="reset-actions">
        <CartoonButton
          onClick={handleReset}
          ariaLabel={t('confirmButton')}
          className="cartoon-btn-danger"
        >
          {t('confirmButton')}
        </CartoonButton>
        <CartoonButton onClick={handleCancel} ariaLabel={t('cancel')}>
          {t('cancel')}
        </CartoonButton>
      </div>
    </>
  );
}

