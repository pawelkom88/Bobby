'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <h2>Something went wrong</h2>
            <p>We couldn&apos;t load this page. Please try again.</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error details (development only)</summary>
                <pre>{error.message}</pre>
              </details>
            )}
            <button
              type="button"
              onClick={reset}
              className="error-reset-button"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
