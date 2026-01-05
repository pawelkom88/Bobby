'use client';

import { useTranslations } from 'next-intl';
import ConversationCard from './ConversationCard';
import type { ConversationListItem } from '@/types';
import CartoonButton from '@/components/CartoonButton';
import { ROUTES } from '@/lib/routes';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  conversations: ConversationListItem[];
  isLoading: boolean;
  error: string | null;
}

export default function ConversationList({
  conversations,
  isLoading,
  error,
}: ConversationListProps) {
  const t = useTranslations('conversationList');
  const tLanding = useTranslations('landing');
  if (isLoading) {
    return (
      <div className={`${styles.list} ${styles.loadingState}`}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerCircle} />
            <div className={styles.spinnerCircle} />
            <div className={styles.spinnerCircle} />
          </div>
          <p className={styles.loadingMessage}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.list} ${styles.errorState}`}>
        <div className={styles.errorMessage}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: '48px', height: '48px', color: '#ef4444' }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={`${styles.list} ${styles.emptyState}`}>
        <div className={styles.emptyStateContent}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9560ED"
            strokeWidth="2"
            style={{ width: '64px', height: '64px' }}
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            <path d="M7 9h10" />
            <path d="M7 13h6" />
          </svg>
          <h3 className={styles.emptyTitle}>{t('noConversations')}</h3>
          <p className={styles.emptyDescription}>{t('noConversationsHint')}</p>
          <CartoonButton asLink href={ROUTES.YOUR_AGE}>
            {tLanding('nav.startTraining')}
          </CartoonButton>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {conversations.map(conversation => (
        <ConversationCard key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}
