'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import Image from 'next/image';
import { AuthButton } from '@/components/AuthButton';
import { logger } from '@/lib/logger';
import { validatePassword, validateEmail, getPasswordRequirements } from '@/lib/validation';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signUp, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'fair' | 'good' | 'strong' | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
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
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error;
    }

    // Validate password with strong requirements
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        // Show the first error for cleaner UX
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await signUp(email, password);
      // Redirect to the intended page or default to /app
      router.push(redirectUrl);
    } catch (error) {
      logger.error('Sign up error:', error);

      // Handle Firebase Auth errors
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setErrors({
              general:
                'This email is already registered. Please log in instead.',
            });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address.' });
            break;
          case 'auth/operation-not-allowed':
            setErrors({
              general:
                'Email/password accounts are not enabled. Please contact support.',
            });
            break;
          case 'auth/weak-password':
            setErrors({
              password: 'Password is too weak. Please use a stronger password.',
            });
            break;
          default:
            setErrors({ general: 'Sign up failed. Please try again.' });
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
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Update password strength indicator
    if (newPassword.length > 0) {
      const validation = validatePassword(newPassword);
      setPasswordStrength(validation.strength);
    } else {
      setPasswordStrength(null);
    }

    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <div className="login-page">
      {/* Decorative sparkles */}
      <div className="login-sparkle" aria-hidden="true" />

      <div
        className="login-container"
        role="main"
        aria-labelledby="signup-title"
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
          Join Bobby!
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-describedby="signup-description"
        >
          <p id="signup-description" className="sr-only">
            Create your Bobby account by entering your email and password.
          </p>

          {/* General Error Message */}
          {errors.general && (
            <div
              className="login-error-message"
              role="alert"
              style={{ marginBottom: '20px', textAlign: 'center' }}
            >
              {errors.general}
            </div>
          )}

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
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={handlePasswordChange}
                className="login-input"
                required
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : 'password-requirements'
                }
                autoComplete="new-password"
              />
            </div>
            {/* Password strength indicator */}
            {passwordStrength && (
              <div
                className={`password-strength password-strength-${passwordStrength}`}
                aria-live="polite"
              >
                Password strength: <strong>{passwordStrength}</strong>
              </div>
            )}
            {errors.password && (
              <div
                id="password-error"
                className="login-error-message"
                role="alert"
              >
                {errors.password}
              </div>
            )}
            <div id="password-requirements" className="sr-only">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="login-password-group">
            <div
              className={`login-input-container ${errors.confirmPassword ? 'login-input-error' : ''}`}
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
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="login-input"
                required
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirm-password-error' : undefined
                }
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <div
                id="confirm-password-error"
                className="login-error-message"
                role="alert"
              >
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Sign Up Button */}
          {/*<AuthButton*/}
          {/*  type="submit"*/}
          {/*  disabled={isSubmitting}*/}
          {/*  aria-describedby="signup-description"*/}
          {/*>*/}
          {/*  {isSubmitting ? 'CREATING ACCOUNT...' : 'SIGN UP'}*/}
          {/*</AuthButton>*/}
        </form>

        {/* Already have account */}
        <div className="login-signup">
          Already part of the team?{' '}
          <Link href={ROUTES.LOGIN} className="login-signup-link">
            Jump back in!
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
