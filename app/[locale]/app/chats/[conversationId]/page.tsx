'use client';

import { Suspense, useEffect, useState, use } from 'react';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConversationDetail from '@/components/ConversationDetail';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/lib/routes';
import type { StoredConversation } from '@/types';

interface ConversationDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

function ConversationDetailContent({ params }: ConversationDetailPageProps) {
  const paramsResolved = use(params);
  const { conversationId } = paramsResolved;
  const { user } = useAuth();
  const t = useTranslations('conversationDetail');
  const [conversation, setConversation] = useState<StoredConversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversation() {
      if (!user || !conversationId) return;

      try {
        setIsLoading(true);
        setError(null);

        const token = await user.getIdToken();
        const response = await fetch(`/api/conversations/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t('errors.notFound'));
          }
          throw new Error(t('errors.fetchFailed'));
        }

        const data = await response.json();
        setConversation(data.conversation);
      } catch (err) {
        logger.error('Error fetching conversation:', err);
        setError(err instanceof Error ? err.message : t('errors.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversation();
  }, [user, conversationId]);

  const handleBack = () => {
    window.location.href = ROUTES.CHATS;
  };

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <ConversationDetail
              conversation={conversation}
              isLoading={isLoading}
              error={error}
              onBack={handleBack}
            />
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}

export default function ConversationDetailPage(props: ConversationDetailPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProtectedRoute>
        <ConversationDetailContent {...props} />
      </ProtectedRoute>
    </Suspense>
  );
}
