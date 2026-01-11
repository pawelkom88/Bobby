'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Link } from '@/i18n/routing';
import { logger } from '@/lib/logger';
import { validatePassword } from '@/lib/validation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuthButton } from '@/components/AuthButton';
import AuthPageLayout, {
  AuthPageHeader,
  AuthErrorMessage,
} from '@/components/AuthPageLayout';
import AuthPasswordInput from '@/components/AuthPasswordInput';

function PasswordStrengthIndicator({
  strength,
}: {
  strength: 'weak' | 'fair' | 'good' | 'strong' | null;
}) {
  const t = useTranslations('resetPassword');
  if (!strength) return null;

  return (
    <div
      className={`password-strength password-strength-${strength}`}
      aria-live="polite"
    >
      <br />
      {t('passwordStrength')}:{' '}
      <strong style={{ color: strength === 'weak' ? 'red' : 'green' }}>
        {t(`strength.${strength}`)}
      </strong>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('resetPassword');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    console.log('oobCode has space?', code?.includes(' '));
    if (!code) {
      setErrors({ general: t('errors.invalidLink') });
      setIsLoading(false);
      return;
    }

    setOobCode(code);
    verifyCode(code);
  }, [searchParams]);

  const verifyCode = async (code: string) => {
    try {
      const auth = getAuth();
      const verifiedEmail = await verifyPasswordResetCode(auth, code);
      setEmail(verifiedEmail);
      setIsLoading(false);
    } catch (error) {
      logger.error('Password reset code verification failed:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/expired-action-code':
            setErrors({ general: t('errors.expiredLink') });
            break;
          case 'auth/invalid-action-code':
            setErrors({ general: t('errors.invalidLink') });
            break;
          case 'auth/user-disabled':
            setErrors({ general: t('errors.userDisabled') });
            break;
          case 'auth/user-not-found':
            setErrors({ general: t('errors.userNotFound') });
            break;
          default:
            setErrors({ general: t('errors.verifyFailed') });
        }
      } else {
        setErrors({ general: t('errors.unexpected') });
      }
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      newErrors.newPassword = passwordValidation.errors.join(', ');
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || !oobCode) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, newPassword);

      logger.info('Password reset successful', { email });
      setIsSuccess(true);

      const url = new URL(window.location.href);
      url.searchParams.delete('oobCode');
      window.history.replaceState({}, '', url.toString());

      setTimeout(() => router.push(t('routes.login')), 3000);
    } catch (error) {
      logger.error('Password reset failed:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/expired-action-code':
            setErrors({ general: t('errors.expiredLink') });
            break;
          case 'auth/invalid-action-code':
            setErrors({ general: t('errors.invalidLink') });
            break;
          case 'auth/user-disabled':
            setErrors({ general: t('errors.userDisabled') });
            break;
          case 'auth/weak-password':
            setErrors({ general: t('errors.weakPassword') });
            break;
          default:
            setErrors({ general: t('errors.resetFailed') });
        }
      } else {
        setErrors({ general: t('errors.unexpected') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (errors.newPassword)
      setErrors(prev => ({ ...prev, newPassword: undefined }));
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword)
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = passwordValidation.strength;

  if (isLoading) {
    return (
      <AuthPageLayout>
        <LoadingSpinner text={t('verifying')} />
      </AuthPageLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthPageLayout>
        <AuthPageHeader title={t('success.title')} />
        <p style={{ textAlign: 'center', marginBottom: '30px' }}>
          {t('success.message')}
        </p>
        <Link
          href="/login"
          className="ach-button"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          {t('success.continue')}
        </Link>
      </AuthPageLayout>
    );
  }

  if (errors.general && !oobCode) {
    return (
      <AuthPageLayout>
        <AuthPageHeader title={t('invalidLink.title')} />
        <AuthErrorMessage error={errors.general} />
        <br />
        <Link href="/login" className="ach-button">
          {t('backToLogin')}
        </Link>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout titleId="reset-title">
      <AuthPageHeader title={t('title')} titleId="reset-title" />

      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        {t('enterNewFor')} <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <AuthPasswordInput
          id="newPassword"
          placeholder={t('newPasswordPlaceholder')}
          value={newPassword}
          onChange={handleNewPasswordChange}
          error={errors.newPassword}
          errorId="newPassword-error"
          label={t('newPasswordLabel')}
          autoComplete="new-password"
          autoFocus
        >
          <PasswordStrengthIndicator
            strength={newPassword ? passwordStrength : null}
          />
        </AuthPasswordInput>

        <AuthPasswordInput
          id="confirmPassword"
          placeholder={t('confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
          errorId="confirmPassword-error"
          label={t('confirmPasswordLabel')}
          autoComplete="new-password"
        />

        <AuthErrorMessage error={errors.general} />

        <AuthButton
          type="submit"
          disabled={isSubmitting}
          style={{ marginTop: '10px' }}
        >
          {isSubmitting ? t('resetting') : t('resetButton')}
        </AuthButton>

        <Link
          style={{ marginTop: '20px' }}
          href="/login"
          className="ach-button"
        >
          {t('backToLogin')}
        </Link>
      </form>
    </AuthPageLayout>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');
  return (
    <Suspense fallback={<LoadingSpinner text={t('loading')} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
