'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import { validatePassword } from '@/lib/validation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuthButton } from '@/components/AuthButton';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get oobCode from URL
  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setErrors({
        general: 'Invalid password reset link. Please request a new one.',
      });
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
            setErrors({
              general:
                'This password reset link has expired. Please request a new one.',
            });
            break;
          case 'auth/invalid-action-code':
            setErrors({
              general:
                'This password reset link is invalid or has already been used. Please request a new one.',
            });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled.' });
            break;
          case 'auth/user-not-found':
            setErrors({ general: 'No account found with this email address.' });
            break;
          default:
            setErrors({
              general: 'Failed to verify reset link. Please try again.',
            });
        }
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      newErrors.newPassword = passwordValidation.errors.join(', ');
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !oobCode) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, oobCode, newPassword);

      logger.info('Password reset successful', { email });
      setIsSuccess(true);

      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('oobCode');
      window.history.replaceState({}, '', url.toString());

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      logger.error('Password reset failed:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/expired-action-code':
            setErrors({
              general:
                'This password reset link has expired. Please request a new one.',
            });
            break;
          case 'auth/invalid-action-code':
            setErrors({
              general:
                'This password reset link is invalid or has already been used. Please request a new one.',
            });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled.' });
            break;
          case 'auth/weak-password':
            setErrors({
              general:
                'Password is too weak. Please choose a stronger password.',
            });
            break;
          default:
            setErrors({
              general: 'Failed to reset password. Please try again.',
            });
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

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    // Clear error when user starts typing
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
    // Clear error when user starts typing
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = passwordValidation.strength;

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-container" role="main">
          <LoadingSpinner text="Verifying reset link..." />
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="login-page">
        <div className="login-container" role="main">
          <Image
            src="/login-bobby.png"
            alt="Bobby Logo"
            width={200}
            height={200}
            className="login-character"
          />
          <h1 className="login-title">Password Reset Successful!</h1>
          <p style={{ textAlign: 'center', marginBottom: '30px' }}>
            Your password has been successfully reset. You will be redirected to
            the login page shortly.
          </p>
          <Link
            href="/login"
            className="ach-button"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Continue to Login
          </Link>
        </div>
      </div>
    );
  }

  if (errors.general && !oobCode) {
    return (
      <div className="login-page">
        <div className="login-container" role="main">
          <Image
            src="/login-bobby.png"
            alt="Bobby Logo"
            width={200}
            height={200}
            className="login-character"
          />
          <h1 className="login-title">Reset Link Invalid</h1>

          <div
            className="reset-warning"
            role="alert"
            style={{ marginBottom: '20px', textAlign: 'center' }}
          >
            {errors.general}
          </div>
          <br />
          <Link href="/login" className="ach-button">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Decorative sparkles */}
      <div className="login-sparkle" aria-hidden="true" />

      <div
        className="login-container"
        role="main"
        aria-labelledby="reset-title"
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
        <h1 id="reset-title" className="login-title">
          Reset Your Password
        </h1>

        <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
          Enter a new password for: <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* New Password Input */}
          <div className="login-input-group">
            <div
              className={`login-input-container ${errors.newPassword ? 'login-input-error' : ''}`}
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
              <label htmlFor="newPassword" className="sr-only">
                New Password
              </label>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className="login-input"
                required
                aria-invalid={!!errors.newPassword}
                aria-describedby={
                  errors.newPassword ? 'newPassword-error' : undefined
                }
                autoComplete="new-password"
                autoFocus
              />
              <button
                style={{ appearance: 'none' }}
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <br />
            {errors.newPassword && (
              <div
                id="newPassword-error"
                className="reset-warning"
                style={{ marginBottom: '20px', textAlign: 'center' }}
                role="alert"
              >
                {errors.newPassword}
              </div>
            )}

            {/* Password Strength Indicator */}
            {newPassword && (
              <div
                className={`password-strength password-strength-${passwordStrength}`}
                aria-live="polite"
              >
                <br />
                Password strength:{' '}
                <strong
                  style={{
                    color: passwordStrength === 'weak' ? 'red' : 'green',
                  }}
                >
                  {passwordStrength}
                </strong>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="login-input-group">
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
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="login-input"
                required
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {showConfirmPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <br />
            {errors.confirmPassword && (
              <div
                id="confirmPassword-error"
                className="reset-warning"
                role="alert"
                style={{ marginBottom: '20px', textAlign: 'center' }}
              >
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div
              className="reset-warning"
              role="alert"
              style={{ marginBottom: '20px', textAlign: 'center' }}
            >
              {errors.general}
            </div>
          )}

          {/* Submit Button */}
          <AuthButton
            type="submit"
            disabled={isSubmitting}
            style={{ marginTop: '10px' }}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </AuthButton>

          {/* Back to Login */}
          <Link
            style={{
              marginTop: '20px',
            }}
            href="/login"
            className="ach-button"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
