'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import { Link } from '@/i18n/routing';
import { logger } from '@/lib/logger';
import { AuthButton } from '@/components/AuthButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import AuthPageLayout, {
  AuthPageHeader,
  AuthErrorMessage,
} from '@/components/AuthPageLayout';
import AuthInput from '@/components/AuthInput';
import { initializeAppCheckIfNeeded } from '@/lib/firebase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const tLoading = useTranslations('loading');
  const { user, signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectUrl = searchParams.get('redirect') || ROUTES.APP;

  useEffect(() => {
    // Initialize App Check only on auth routes
    initializeAppCheckIfNeeded();
    
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (!password.trim()) {
      newErrors.password = t('errors.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('errors.passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signIn(email, password);
      router.push(redirectUrl);
    } catch (error) {
      logger.error('Login error:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setErrors({ general: t('errors.invalidCredential') });
            break;
          case 'auth/too-many-requests':
            setErrors({ general: t('errors.tooManyRequests') });
            break;
          case 'auth/user-disabled':
            setErrors({ general: t('errors.userDisabled') });
            break;
          default:
            setErrors({ general: t('errors.loginFailed') });
        }
      } else {
        setErrors({ general: t('errors.unexpectedError') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  if (authLoading || user) {
    return <LoadingSpinner text={tLoading('redirecting')} heading={tLoading('pleaseWait')} />;
  }

  return (
    <AuthPageLayout titleId="login-title">
      <AuthPageHeader title={t('login.title')} titleId="login-title" />

      <form onSubmit={handleSubmit} noValidate aria-describedby="login-description">
        <p id="login-description" className="sr-only">
          {t('login.description')}
        </p>

        <AuthInput
          id="email"
          type="email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          errorId="email-error"
          label={t('login.emailLabel')}
          icon="user"
          autoComplete="email"
          autoFocus
        />

        <AuthInput
          id="password"
          type="password"
          placeholder={t('login.passwordPlaceholder')}
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          errorId="password-error"
          label={t('login.passwordLabel')}
          icon="lock"
          autoComplete="current-password"
        />

        <AuthButton type="submit" disabled={isSubmitting} aria-describedby="login-description">
          {isSubmitting ? t('login.submitting') : t('login.submit')}
        </AuthButton>
      </form>

      <AuthErrorMessage error={errors.general} />

      <div className="login-forgot-password">
        <Link href={ROUTES.FORGOT_PASSWORD} className="login-forgot-link">
          {t('login.forgotPassword')}
        </Link>
      </div>

      <div className="login-signup">
        {t('login.signupPrompt')} <br />
        <Link href={ROUTES.SIGNUP} className="login-signup-link">
          {t('login.signupLink')}
        </Link>
      </div>
    </AuthPageLayout>
  );
}

export default function BobbyLogin() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
