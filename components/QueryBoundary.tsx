'use client';

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface QueryBoundaryProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => React.ReactNode);
  level?: 'global' | 'page' | 'feature' | 'component';
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const t = useTranslations('queryBoundary');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-2xl">⚠️</div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        {t('defaultErrorTitle')}
      </h2>
      <p className="mb-4 text-gray-600">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * QueryBoundary component that combines Suspense + ErrorBoundary + QueryErrorResetBoundary
 * 
 * Usage:
 * <QueryBoundary>
 *   <YourComponent />
 * </QueryBoundary>
 * 
 * With custom fallbacks:
 * <QueryBoundary
 *   loadingFallback={<CustomSkeleton />}
 *   errorFallback={(error, reset) => <CustomError error={error} onReset={reset} />}
 * >
 *   <YourComponent />
 * </QueryBoundary>
 */
export function QueryBoundary({
  children,
  loadingFallback = <DefaultLoadingFallback />,
  errorFallback,
  level = 'component',
}: QueryBoundaryProps) {
  const t = useTranslations('queryBoundary');

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={errorFallback && typeof errorFallback === 'function' 
            ? errorFallback 
            : () => errorFallback || <DefaultErrorFallback error={new Error(t('unknownError'))} resetErrorBoundary={reset} />
          }
          onError={(error, errorInfo) => {
            // Log error based on boundary level
            console.error(`QueryBoundary [${level}] Error:`, error, errorInfo);
          }}
        >
          <Suspense fallback={loadingFallback}>
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

/**
 * Page-level boundary with larger loading state
 */
export function PageQueryBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryBoundary
      level="page"
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      {children}
    </QueryBoundary>
  );
}

/**
 * Feature-level boundary for isolating sections
 */
export function FeatureQueryBoundary({ 
  children, 
  featureName 
}: { 
  children: React.ReactNode;
  featureName?: string;
}) {
  const t = useTranslations('queryBoundary');

  return (
    <QueryBoundary
      level="feature"
      errorFallback={({ error, resetErrorBoundary }) => (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h3 className="mb-2 font-semibold text-red-900">
            {featureName
              ? t('featureErrorTitle', { featureName })
              : t('featureErrorGenericTitle')}
          </h3>
          <p className="mb-2 text-sm text-red-700">{error.message}</p>
          <button
            onClick={resetErrorBoundary}
            className="text-sm text-red-700 underline hover:no-underline"
          >
            {t('retry')}
          </button>
        </div>
      )}
    >
      {children}
    </QueryBoundary>
  );
}
