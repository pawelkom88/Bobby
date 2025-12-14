'use client';

import { useEffect, useState } from 'react';
import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConversationList from '@/components/ConversationList';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';
import type { ConversationListItem } from '@/types';

function ChatsPageContent() {
  const { user } = useAuth();
  const t = useTranslations('chats');
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const token = await user.getIdToken();
        const response = await fetch('/api/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t('loadingError'));
        }

        const data = await response.json();
        
        // Check if API call was successful
        if (data.success) {
          setConversations(data.conversations || []);
        } else {
          setError(data.message || t('loadingError'));
        }
      } catch (err) {
        logger.error('Error fetching conversations:', err);
        setError(t('loadingError'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, [user]);

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <main className="app-page" role="main">
            <div className="chats-page">
              <h1 className="chats-page__title">{t('title')}</h1>
              <p className="chats-page__subtitle">{t('subtitle')}</p>
              
              <ConversationList
                conversations={conversations}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </main>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}

export default function ChatsPage() {
  return (
    <ProtectedRoute>
      <ChatsPageContent />
    </ProtectedRoute>
  );
}
