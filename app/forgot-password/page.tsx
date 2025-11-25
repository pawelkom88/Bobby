'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';

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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);

      // Handle Firebase Auth errors
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
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  if (emailSent) {
    return (
      <div className="login-page">
        <div className="login-sparkle" aria-hidden="true" />

        <div className="login-container" role="main" aria-labelledby="success-title">
          {/* Character Placeholder */}
          <div className="login-character" aria-hidden="true">
            <div className="login-headphones">
              <div className="login-headphone-left" />
              <div className="login-headphone-right" />
            </div>
            <div className="login-face">
              <div className="login-eyes">
                <div className="login-eye login-eye-left" />
                <div className="login-eye login-eye-right" />
              </div>
              <div className="login-mouth" />
            </div>
            <div className="login-character-shadow" />
          </div>

          <h1 id="success-title" className="login-title">
            Check Your Email!
          </h1>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <p style={{ fontSize: '18px', color: '#4A4A5E', marginBottom: '20px' }}>
              We've sent a password reset link to:
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2C3E50', marginBottom: '30px' }}>
              {email}
            </p>
            <p style={{ fontSize: '16px', color: '#7F8C8D' }}>
              Click the link in the email to reset your password.
              <br />
              Don't forget to check your spam folder!
            </p>
          </div>

          <Link href={ROUTES.LOGIN} className="login-button" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
            BACK TO LOGIN
          </Link>

          <div className="login-signup" style={{ marginTop: '20px' }}>
            Didn't receive the email?{' '}
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail('');
              }}
              className="login-signup-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Decorative sparkles */}
      <div className="login-sparkle" aria-hidden="true" />

      <div className="login-container" role="main" aria-labelledby="forgot-password-title">
        {/* Character Placeholder */}
        <div className="login-character" aria-hidden="true">
          {/* Headphones */}
          <div className="login-headphones">
            <div className="login-headphone-left" />
            <div className="login-headphone-right" />
          </div>

          {/* Face */}
          <div className="login-face">
            {/* Eyes */}
            <div className="login-eyes">
              <div className="login-eye login-eye-left" />
              <div className="login-eye login-eye-right" />
            </div>
            {/* Mouth */}
            <div className="login-mouth" />
          </div>

          {/* Shadow */}
          <div className="login-character-shadow" />
        </div>

        {/* Welcome Text */}
        <h1 id="forgot-password-title" className="login-title">
          Reset Password
        </h1>

        <p style={{ textAlign: 'center', color: '#7F8C8D', marginBottom: '30px', fontSize: '16px' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} noValidate aria-describedby="forgot-password-description">
          <p id="forgot-password-description" className="sr-only">
            Enter your email address to receive a password reset link.
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
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email Address"
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
              <div id="email-error" className="login-error-message" role="alert">
                {errors.email}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
            aria-describedby="forgot-password-description"
          >
            {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="login-signup">
          Remember your password?{' '}
          <Link href={ROUTES.LOGIN} className="login-signup-link">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

