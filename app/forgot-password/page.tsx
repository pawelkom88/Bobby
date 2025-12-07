'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
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
  return (
    <AuthPageLayout titleId="success-title">
      <AuthPageHeader title="Check Your Email!" titleId="success-title" />

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '18px', color: '#4A4A5E', marginBottom: '20px' }}>
          We&apos;ve sent a password reset link to:
        </p>
        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '30px' }}>
          {email}
        </p>
        <p style={{ fontSize: '16px', color: '#7F8C8D' }}>
          Click the link in the email to reset your password.
          <br />
          Don&apos;t forget to check your spam folder!
        </p>
      </div>

      <Link href={ROUTES.LOGIN} className="ach-button" style={{ textDecoration: 'none' }}>
        BACK TO LOGIN
      </Link>

      <div className="login-signup" style={{ marginTop: '20px' }}>
        Didn&apos;t receive the email?{' '}
        <button
          onClick={onTryAgain}
          className="login-signup-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Try Again
        </button>
      </div>
    </AuthPageLayout>
  );
}

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
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
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      logger.error('Password reset error:', error);

      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            setErrors({ general: 'No account found with this email address.' });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address.' });
            break;
          case 'auth/too-many-requests':
            setErrors({ general: 'Too many requests. Please try again later.' });
            break;
          default:
            setErrors({ general: 'Failed to send reset email. Please try again.' });
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

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail('');
  };

  if (emailSent) {
    return <EmailSentSuccess email={email} onTryAgain={handleTryAgain} />;
  }

  return (
    <AuthPageLayout titleId="forgot-password-title">
      <AuthPageHeader
        title="Reset Password"
        titleId="forgot-password-title"
        description="Enter your email address and we'll send you a link to reset your password."
      />

      <form onSubmit={handleSubmit} noValidate aria-describedby="forgot-password-description">
        <p id="forgot-password-description" className="sr-only">
          Enter your email address to receive a password reset link.
        </p>

        <AuthErrorMessage error={errors.general} />

        <AuthInput
          id="email"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          errorId="email-error"
          label="Email Address"
          icon="user"
          autoComplete="email"
          autoFocus
        />

        <AuthButton type="submit" disabled={isSubmitting} aria-describedby="forgot-password-description">
          {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
        </AuthButton>
      </form>

      <div className="login-signup">
        Password back in your head? <br />
        <Link href={ROUTES.LOGIN} className="login-signup-link">
          Let&apos;s go!
        </Link>
      </div>
    </AuthPageLayout>
  );
}
