'use client';

import Link from 'next/link';
import DialPad from '@/components/DialPad';
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
    <ErrorBoundary>
      <main className="app-page" role="main">
        <DialPad onCorrectNumber={handleCorrectNumber} onBack={handleBack} />
      </main>
    </ErrorBoundary>
  );
}

