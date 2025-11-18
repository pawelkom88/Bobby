'use client';

import { ViewTransition } from 'react';
import DialPad from '@/components/DialPad';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DialPage() {
  const handleCorrectNumber = () => {
    // Navigate to conversation page
    window.location.href = '/app/conversation';
  };

  const handleBack = () => {
    // Navigate back to welcome
    window.location.href = '/app';
  };

  return (
    <ViewTransition>
    <PageWrapper>
      <ErrorBoundary>
        <main className="app-page" role="main">
          <DialPad onCorrectNumber={handleCorrectNumber} onBack={handleBack} />
        </main>
      </ErrorBoundary>
    </PageWrapper>
    </ViewTransition>
  );
}

