'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { AuthButton } from '@/components/AuthButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import AuthPageLayout, {
  AuthPageHeader,
  AuthErrorMessage,
} from '@/components/AuthPageLayout';
import AuthInput from '@/components/AuthInput';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
            setErrors({ general: 'Invalid email or password. Please try again.' });
            break;
          case 'auth/too-many-requests':
            setErrors({ general: 'Too many failed attempts. Please try again later.' });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled.' });
            break;
          default:
            setErrors({ general: 'Login failed. Please try again.' });
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
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
  };

  if (authLoading) {
    return <LoadingSpinner text="Redirecting to app..." />;
  }

  return (
    <AuthPageLayout titleId="login-title">
      <AuthPageHeader title="Welcome Back to Bobby!" titleId="login-title" />

      <form onSubmit={handleSubmit} noValidate aria-describedby="login-description">
        <p id="login-description" className="sr-only">
          Please enter your email and password to log in to your Bobby account.
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
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          errorId="password-error"
          label="Password"
          icon="lock"
          autoComplete="current-password"
        />

        <AuthButton type="submit" disabled={isSubmitting} aria-describedby="login-description">
          {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
        </AuthButton>
      </form>

      <AuthErrorMessage error={errors.general} />

      <div className="login-forgot-password">
        <Link href={ROUTES.FORGOT_PASSWORD} className="login-forgot-link">
          Password playing hide and seek?
        </Link>
      </div>

      <div className="login-signup">
        First time caller? <br />
        <Link href={ROUTES.SIGNUP} className="login-signup-link">
          Sign up to join the fun!
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
