'use client';

import { Suspense } from 'react';
import BetaFeedbackForm from '@/components/BetaFeedbackForm';
import PageWrapper from '@/components/PageWrapper';
import LoadingSpinner from '@/components/LoadingSpinner';

function BetaFeedbackPageContent() {
  return (
    <PageWrapper>
      <main className="app-page" role="main">
        <BetaFeedbackForm />
      </main>
    </PageWrapper>
  );
}

export default function BetaFeedbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BetaFeedbackPageContent />
    </Suspense>
  );
}
