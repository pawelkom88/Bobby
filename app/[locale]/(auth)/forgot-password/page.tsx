'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import { Link } from '@/i18n/routing';
import { AuthButton } from '@/components/AuthButton';
import { logger } from '@/lib/logger';
import AuthPageLayout, {
  AuthPageHeader,
  AuthErrorMessage,
} from '@/components/AuthPageLayout';
import AuthInput from '@/components/AuthInput';

function EmailSentSuccess({
  email,
  onTryAgain,
}: {
  email: string;
  onTryAgain: () => void;
}) {
  const t = useTranslations('forgotPassword');
  return (
    <AuthPageLayout titleId="success-title">
      <AuthPageHeader title={t('emailSent.title')} titleId="success-title" />

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '18px', color: '#4A4A5E', marginBottom: '20px' }}>
          {t('emailSent.sentTo')}
        </p>
        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '30px' }}>
          {email}
        </p>
        <p style={{ fontSize: '16px', color: '#7F8C8D' }}>
          {t('emailSent.instructions')}
          <br />
          {t('emailSent.checkSpam')}
        </p>
      </div>

      <Link href={ROUTES.LOGIN} className="ach-button" style={{ textDecoration: 'none' }}>
        {t('backToLogin')}
      </Link>

      <div className="login-signup" style={{ marginTop: '20px' }}>
        {t('emailSent.notReceived')}{' '}
        <button
          onClick={onTryAgain}
          className="login-signup-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {t('emailSent.tryAgain')}
        </button>
      </div>
    </AuthPageLayout>
  );
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const t = useTranslations('forgotPassword');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await resetPassword(email, company);
      setEmailSent(true);
    } catch (error) {
      logger.error('Password reset error:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            setErrors({ general: t('errors.userNotFound') });
            break;
          case 'auth/invalid-email':
            setErrors({ email: t('errors.emailInvalid') });
            break;
          case 'auth/too-many-requests':
            setErrors({ general: t('errors.tooManyRequests') });
            break;
          default:
            setErrors({ general: t('errors.sendFailed') });
        }
      } else {
        setErrors({ general: t('errors.unexpected') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail('');
    setCompany('');
  };

  if (emailSent) {
    return <EmailSentSuccess email={email} onTryAgain={handleTryAgain} />;
  }

  return (
    <AuthPageLayout titleId="forgot-password-title">
      <AuthPageHeader
        title={t('title')}
        titleId="forgot-password-title"
        description={t('description')}
      />

      <form onSubmit={handleSubmit} noValidate aria-describedby="forgot-password-description">
        <p id="forgot-password-description" className="sr-only">
          {t('srDescription')}
        </p>

        <AuthErrorMessage error={errors.general} />

        <AuthInput
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          errorId="email-error"
          label={t('emailLabel')}
          icon="user"
          autoComplete="email"
          autoFocus
        />

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
          />
        </div>

        <AuthButton type="submit" disabled={isSubmitting} aria-describedby="forgot-password-description">
          {isSubmitting ? t('sending') : t('sendButton')}
        </AuthButton>
      </form>

      <div className="login-signup">
        {t('rememberedPassword')} <br />
        <Link href={ROUTES.LOGIN} className="login-signup-link">
          {t('backToLogin')}
        </Link>
      </div>
    </AuthPageLayout>
  );
}
