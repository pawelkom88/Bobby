'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
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
}: {
  strength: 'weak' | 'fair' | 'good' | 'strong' | null;
}) {
  if (!strength) return null;

  return (
    <div
      className={`password-strength password-strength-${strength}`}
      aria-live="polite"
    >
      <br />
      Password strength:{' '}
      <strong style={{ color: strength === 'weak' ? 'red' : 'green' }}>
        {strength}
      </strong>
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
            setErrors({ general: 'This email is already registered. Please log in instead.' });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address.' });
            break;
          case 'auth/operation-not-allowed':
            setErrors({ general: 'Email/password accounts are not enabled. Please contact support.' });
            break;
          case 'auth/weak-password':
            setErrors({ password: 'Password is too weak. Please use a stronger password.' });
            break;
          default:
            setErrors({ general: 'Sign up failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
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

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
  };

  return (
    <AuthPageLayout titleId="signup-title">
      <AuthPageHeader title="Join Bobby!" titleId="signup-title" />

      <form onSubmit={handleSubmit} noValidate aria-describedby="signup-description">
        <p id="signup-description" className="sr-only">
          Create your Bobby account by entering your email and password.
        </p>

        <AuthInput
          id="email"
          type="email"
          placeholder="Parent Email"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          errorId="email-error"
          label="Parent Email"
          icon="user"
          autoComplete="email"
          autoFocus
        />

        <AuthInput
          id="password"
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          errorId="password-error"
          label="Password"
          icon="lock"
          autoComplete="new-password"
          describedBy={errors.password ? undefined : 'password-requirements'}
        >
          <PasswordStrengthIndicator strength={passwordStrength} />
          <div id="password-requirements" className="sr-only">
            Password must be at least 8 characters with uppercase, lowercase, number, and special character
          </div>
        </AuthInput>

        <AuthInput
          id="confirm-password"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
          errorId="confirm-password-error"
          label="Confirm Password"
          icon="lock"
          autoComplete="new-password"
        />

        <AuthButton type="submit" disabled={isSubmitting} aria-describedby="signup-description">
          {isSubmitting ? 'CREATING ACCOUNT...' : 'SIGN UP'}
        </AuthButton>
      </form>

      <AuthErrorMessage error={errors.general} />

      <div className="login-signup">
        Already part of the team?{' '}
        <Link href={ROUTES.LOGIN} className="login-signup-link">
          Jump back in!
        </Link>
      </div>
    </AuthPageLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading ..." />}>
      <SignUpForm />
    </Suspense>
  );
}
