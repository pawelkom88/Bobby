'use client';

import { Suspense, use } from 'react';
import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConversationDetail from '@/components/ConversationDetail';
import LoadingSpinner from '@/components/LoadingSpinner';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';
import { useConversation } from '@/hooks/queries/useConversations';

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

function ConversationDetailContent({ params }: ConversationDetailPageProps) {
  const paramsResolved = use(params);
  const { conversationId } = paramsResolved;
  const t = useTranslations('conversationDetail');
  const {
    data: conversation,
    isLoading,
    error,
  } = useConversation(conversationId);

  if (error) {
    logger.error('Error fetching conversation:', error);
  }

  const errorMessage = error
    ? error.message === 'Conversation not found'
      ? t('errors.notFound')
      : t('errors.fetchFailed')
    : null;

  const handleBack = () => {
    window.location.href = ROUTES.CHATS;
  };

  return (
    <PageWrapper>
      <ErrorBoundary>
        <main className="app-page" role="main">
          <ConversationDetail
            conversation={conversation ?? null}
            isLoading={isLoading}
            error={errorMessage}
            onBack={handleBack}
          />
        </main>
      </ErrorBoundary>
    </PageWrapper>
  );
}

export default function ConversationDetailPage(
  props: ConversationDetailPageProps
) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedRoute>
        <ConversationDetailContent {...props} />
      </ProtectedRoute>
    </Suspense>
  );
}
