'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CartoonButton from '@/components/CartoonButton';
import { useAuth } from '@/context/AuthContext';
import { useDeleteAccount } from '@/hooks/mutations/useDeleteAccount';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';

export default function DeleteAccountSection() {
  const t = useTranslations('deleteAccount');
  const { signOut } = useAuth();
  const router = useRouter();
  const deleteAccountMutation = useDeleteAccount();

  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      setError(null);
      return;
    }

    setError(null);

    deleteAccountMutation.reset();

    deleteAccountMutation
      .mutateAsync()
      .then(async () => {
        await signOut();
        router.push(ROUTES.HOME);
      })
      .catch((err: any) => {
        logger.error('Error deleting account:', err);
        const message =
          err?.message === 'AUTH_REQUIRED' ? t('errors.failed') : err?.message;
        setError(message || t('errors.failed'));
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
          disabled={deleteAccountMutation.isPending}
        >
          {t('button')}
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
          disabled={deleteAccountMutation.isPending}
        >
          {deleteAccountMutation.isPending ? t('deleting') : t('confirmButton')}
        </CartoonButton>
        <CartoonButton
          onClick={handleCancel}
          ariaLabel={t('cancel')}
          disabled={deleteAccountMutation.isPending}
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
