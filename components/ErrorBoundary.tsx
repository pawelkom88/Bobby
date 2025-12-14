'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';

interface ErrorBoundaryFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorBoundaryFallback({ error, onReset }: ErrorBoundaryFallbackProps) {
  const t = useTranslations('errorBoundary');

  return (
    <div className="error-boundary" role="alert">
      <div className="error-boundary-content">
        <h2>{t('title')}</h2>
        <p>{t('message')}</p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className="error-details">
            <summary>{t('devDetails')}</summary>
            <pre>{error.toString()}</pre>
          </details>
        )}
        <button
          type="button"
          onClick={onReset}
          className="error-reset-button"
          aria-label={t('tryAgain')}
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch and handle React errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
