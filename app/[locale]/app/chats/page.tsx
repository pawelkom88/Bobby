'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConversationList from '@/components/ConversationList';
import { useConversations } from '@/hooks/queries/useConversations';
import { SpeculationRules } from '@/components/SpeculationRules';
import { ROUTES } from '@/lib/routes';
import styles from './ChatsPage.module.css';

function ChatsPageContent() {
  const t = useTranslations('chats');
  const { data: conversations = [], isLoading, error } = useConversations();

  const errorMessage = error ? t('loadingError') : null;

  return (
    <PageWrapper>
      <ErrorBoundary>
        <main className="app-page" role="main">
          <div className={styles.page}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>

            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              error={errorMessage}
            />
          </div>
        </main>
      </ErrorBoundary>
    </PageWrapper>
  );
}

export default function ChatsPage() {
  return (
    <ProtectedRoute>
      <ChatsPageContent />
      <SpeculationRules
        prefetchPaths={[ROUTES.APP, ROUTES.ACHIEVEMENTS, ROUTES.SETTINGS]}
        eagerness="moderate"
      />
    </ProtectedRoute>
  );
}
