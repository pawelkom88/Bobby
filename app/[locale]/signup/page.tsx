'use client';

import React, { useState, FormEvent, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { logger } from '@/lib/logger';
import { validatePassword, validateEmail } from '@/lib/validation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuthButton } from '@/components/AuthButton';
import AuthPageLayout, {
  AuthPageHeader,
  AuthErrorMessage,
} from '@/components/AuthPageLayout';
import AuthInput from '@/components/AuthInput';

function PasswordStrengthIndicator({
  strength,
  label,
}: {
  strength: 'weak' | 'fair' | 'good' | 'strong' | null;
  label: string;
}) {
  if (!strength) return null;

  return (
    <div
      className={`password-strength password-strength-${strength}`}
      aria-live="polite"
    >
      <br />
      {label}:{' '}
      <strong style={{ color: strength === 'weak' ? 'red' : 'green' }}>
        {strength}
      </strong>
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const tLoading = useTranslations('loading');
  const { user, signUp, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'fair' | 'good' | 'strong' | null
  >(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || ROUTES.APP;

  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    if (!password.trim()) {
      newErrors.password = t('errors.passwordRequired');
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t('errors.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordsMismatch');
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
      const userCredential = await signUp(email, password);
      const idToken = await userCredential.user.getIdToken();

      // Send welcome email (don't block signup if email fails)
      try {
        const response = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({}),
        });
        if (!response.ok) {
          logger.error('Welcome email failed:', { status: response.status });
        } else {
          logger.info('Welcome email sent successfully');
        }
      } catch (emailError) {
        logger.error('Welcome email error:', emailError);
      }

      router.push(redirectUrl);
    } catch (error) {
      logger.error('Sign up error:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setErrors({ general: t('errors.emailInUse') });
            break;
          case 'auth/invalid-email':
            setErrors({ email: t('errors.invalidEmail') });
            break;
          case 'auth/operation-not-allowed':
            setErrors({ general: t('errors.operationNotAllowed') });
            break;
          case 'auth/weak-password':
            setErrors({ password: t('errors.weakPassword') });
            break;
          default:
            setErrors({ general: t('errors.signupFailed') });
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
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword.length > 0) {
      const validation = validatePassword(newPassword);
      setPasswordStrength(validation.strength);
    } else {
      setPasswordStrength(null);
    }

    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword)
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
  };

  return (
    <AuthPageLayout titleId="signup-title">
      <AuthPageHeader title={t('signup.title')} titleId="signup-title" />

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby="signup-description"
      >
        <p id="signup-description" className="sr-only">
          {t('signup.description')}
        </p>

        <AuthInput
          id="email"
          type="email"
          placeholder={t('signup.emailPlaceholder')}
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          errorId="email-error"
          label={t('signup.emailLabel')}
          icon="user"
          autoComplete="email"
          autoFocus
        />

        <AuthInput
          id="password"
          type="password"
          placeholder={t('signup.passwordPlaceholder')}
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          errorId="password-error"
          label={t('signup.passwordLabel')}
          icon="lock"
          autoComplete="new-password"
          describedBy={errors.password ? undefined : 'password-requirements'}
        >
          <PasswordStrengthIndicator
            strength={passwordStrength}
            label={t('signup.passwordStrength')}
          />
          <div id="password-requirements" className="sr-only">
            {t('signup.passwordRequirements')}
          </div>
        </AuthInput>

        <AuthInput
          id="confirm-password"
          type="password"
          placeholder={t('signup.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
          errorId="confirm-password-error"
          label={t('signup.confirmPasswordLabel')}
          icon="lock"
          autoComplete="new-password"
        />

        <AuthButton
          type="submit"
          disabled={isSubmitting}
          aria-describedby="signup-description"
        >
          {isSubmitting ? t('signup.submitting') : t('signup.submit')}
        </AuthButton>
      </form>

      <AuthErrorMessage error={errors.general} />

      <div className="login-signup">
        {t('signup.loginPrompt')}{' '}
        <Link href={ROUTES.LOGIN} className="login-signup-link">
          {t('signup.loginLink')}
        </Link>
      </div>
    </AuthPageLayout>
  );
}

export default function SignUpPage() {
  const tLoading = useTranslations('loading');
  return (
    <Suspense
      fallback={
        <LoadingSpinner
          text={tLoading('generic')}
          heading={tLoading('heading')}
        />
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
