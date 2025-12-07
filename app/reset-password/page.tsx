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
import { logger } from '@/lib/logger';
import { validatePassword } from '@/lib/validation';
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

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setErrors({ general: 'Invalid password reset link. Please request a new one.' });
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
            setErrors({ general: 'This password reset link has expired. Please request a new one.' });
            break;
          case 'auth/invalid-action-code':
            setErrors({ general: 'This password reset link is invalid or has already been used. Please request a new one.' });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled.' });
            break;
          case 'auth/user-not-found':
            setErrors({ general: 'No account found with this email address.' });
            break;
          default:
            setErrors({ general: 'Failed to verify reset link. Please try again.' });
        }
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
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
      newErrors.confirmPassword = 'Passwords do not match';
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

      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      logger.error('Password reset failed:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/expired-action-code':
            setErrors({ general: 'This password reset link has expired. Please request a new one.' });
            break;
          case 'auth/invalid-action-code':
            setErrors({ general: 'This password reset link is invalid or has already been used. Please request a new one.' });
            break;
          case 'auth/user-disabled':
            setErrors({ general: 'This account has been disabled.' });
            break;
          case 'auth/weak-password':
            setErrors({ general: 'Password is too weak. Please choose a stronger password.' });
            break;
          default:
            setErrors({ general: 'Failed to reset password. Please try again.' });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = passwordValidation.strength;

  if (isLoading) {
    return (
      <AuthPageLayout>
        <LoadingSpinner text="Verifying reset link..." />
      </AuthPageLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthPageLayout>
        <AuthPageHeader title="Password Reset Successful!" />
        <p style={{ textAlign: 'center', marginBottom: '30px' }}>
          Your password has been successfully reset. You will be redirected to the login page shortly.
        </p>
        <Link href="/login" className="ach-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Continue to Login
        </Link>
      </AuthPageLayout>
    );
  }

  if (errors.general && !oobCode) {
    return (
      <AuthPageLayout>
        <AuthPageHeader title="Reset Link Invalid" />
        <AuthErrorMessage error={errors.general} />
        <br />
        <Link href="/login" className="ach-button">
          Back to Login
        </Link>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout titleId="reset-title">
      <AuthPageHeader title="Reset Your Password" titleId="reset-title" />

      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        Enter a new password for: <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="newPassword"
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={handleNewPasswordChange}
          error={errors.newPassword}
          errorId="newPassword-error"
          label="New Password"
          icon="lock"
          autoComplete="new-password"
          autoFocus
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
        >
          <PasswordStrengthIndicator strength={newPassword ? passwordStrength : null} />
        </AuthInput>

        <AuthInput
          id="confirmPassword"
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
          errorId="confirmPassword-error"
          label="Confirm New Password"
          icon="lock"
          autoComplete="new-password"
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        <AuthErrorMessage error={errors.general} />

        <AuthButton type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </AuthButton>

        <Link style={{ marginTop: '20px' }} href="/login" className="ach-button">
          Back to Login
        </Link>
      </form>
    </AuthPageLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading ..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
