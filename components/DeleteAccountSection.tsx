'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CartoonButton from '@/components/CartoonButton';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';

export default function DeleteAccountSection() {
  const t = useTranslations('deleteAccount');
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      setError(null);
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const idToken = await user?.getIdToken();
        if (!idToken) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/account/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to delete account');
        }

        await signOut();
        router.push(ROUTES.HOME);
      } catch (err: any) {
        logger.error('Error deleting account:', err);
        setError(err.message || t('errors.failed'));
      }
    });
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setError(null);
  };

  if (!showConfirm) {
    return (
      <div className="progress-section">
        <CartoonButton
          onClick={handleDelete}
          ariaLabel={t('button')}
          className="cartoon-btn-danger"
          disabled={isPending}
        >
          🗑️ {t('button')}
        </CartoonButton>
        {error && (
          <p className="reset-warning" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="progress-section">
      <p className="reset-warning" role="alert">
        {t('confirmMessage')}
      </p>
      <div className="reset-actions">
        <CartoonButton
          onClick={handleDelete}
          ariaLabel={t('confirmButton')}
          className="cartoon-btn-danger"
          disabled={isPending}
        >
          {isPending ? t('deleting') : t('confirmButton')}
        </CartoonButton>
        <CartoonButton
          onClick={handleCancel}
          ariaLabel={t('cancel')}
          disabled={isPending}
        >
          {t('cancel')}
        </CartoonButton>
      </div>
      {error && (
        <p className="reset-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

