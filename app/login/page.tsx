'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { AuthButton } from '@/components/AuthButton';
import LoadingSpinner from '@/components/LoadingSpinner';

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

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || ROUTES.APP;

  // Redirect if already logged in
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
      // Redirect to the intended page or default to /app
      router.push(redirectUrl);
    } catch (error) {
      logger.error('Login error:', error);

      // Handle Firebase Auth errors
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setErrors({
              general: 'Invalid email or password. Please try again.',
            });
            break;
          case 'auth/too-many-requests':
            setErrors({
              general: 'Too many failed attempts. Please try again later.',
            });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled.' });
            break;
          default:
            setErrors({ general: 'Login failed. Please try again.' });
        }
      } else {
        setErrors({
          general: 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="login-page">
      {/* Decorative sparkles */}
      <div className="login-sparkle" aria-hidden="true" />

      <div
        className="login-container"
        role="main"
        aria-labelledby="login-title"
      >
        {/* Character Placeholder */}
        <Image
          src="/login-bobby.png"
          alt="Bobby Logo"
          width={200}
          height={200}
          className="login-character"
        />

        {/* Welcome Text */}
        <h1 id="login-title" className="login-title">
          Welcome Back to Bobby!
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-describedby="login-description"
        >
          <p id="login-description" className="sr-only">
            Please enter your email and password to log in to your Bobby
            account.
          </p>

          {/* Email Input */}
          <div className="login-input-group">
            <div
              className={`login-input-container ${errors.email ? 'login-input-error' : ''}`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="login-input-icon"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="5" fill="#A0A0B0" />
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" fill="#A0A0B0" />
              </svg>
              <label htmlFor="email" className="sr-only">
                Parent Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Parent Email"
                value={email}
                onChange={handleEmailChange}
                className="login-input"
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && (
              <div
                id="email-error"
                className="login-error-message"
                role="alert"
              >
                {errors.email}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="login-password-group">
            <div
              className={`login-input-container ${errors.password ? 'login-input-error' : ''}`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="login-input-icon"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="11"
                  width="14"
                  height="10"
                  rx="2"
                  fill="#A0A0B0"
                />
                <path
                  d="M8 11V7a4 4 0 018 0v4"
                  stroke="#A0A0B0"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                className="login-input"
                required
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                autoComplete="current-password"
              />
            </div>
            {errors.password && (
              <div
                id="password-error"
                className="login-error-message"
                role="alert"
              >
                {errors.password}
              </div>
            )}
          </div>

          {/* Login Button */}
          <AuthButton
            type="submit"
            disabled={isSubmitting}
            aria-describedby="login-description"
          >
            {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
          </AuthButton>
        </form>

        {/* Divider */}
        {/*<div className="login-divider">*/}
        {/*  <span className="login-divider-text">or</span>*/}
        {/*</div>*/}

        {/*<GoogleSignInButton />*/}

        {/* General Error Message */}
        {errors.general && (
          <div
            className="reset-warning"
            role="alert"
            style={{ marginBottom: '20px', textAlign: 'center' }}
          >
            {errors.general}
          </div>
        )}

        {/* Forgot Password */}
        <div className="login-forgot-password">
          <Link href={ROUTES.FORGOT_PASSWORD} className="login-forgot-link">
            Password playing hide and seek?
          </Link>
        </div>

        {/* Sign Up */}
        <div className="login-signup">
          First time caller? <br />
          <Link href={ROUTES.SIGNUP} className="login-signup-link">
            Sign up to join the fun!
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BobbyLogin() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginForm />
    </Suspense>
  );
}
