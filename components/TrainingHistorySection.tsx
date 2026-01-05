'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';
import listStyles from './ConversationList.module.css';

interface AssessedConversation {
  id: string;
  service: 'fire' | 'ambulance' | 'police';
  ageTier: 1 | 2 | 3;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  xpEarned: number;
  score?: number;
  feedback?: string[];
}

export default function TrainingHistorySection() {
  const { user } = useAuth();
  const t = useTranslations('trainingHistory');
  const [assessedConversations, setAssessedConversations] = useState<
    AssessedConversation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessedConversations() {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const token = await user.getIdToken();
        const response = await fetch('/api/conversations/assessed', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(t('fetchError'));
        }

        const data = await response.json();

        if (data.success) {
          setAssessedConversations(data.conversations || []);
        } else {
          setError(
            data.message ||
              t('loadError')
          );
        }
      } catch (err) {
        logger.error('Error fetching assessed conversations:', err);
        setError(t('loadError'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssessedConversations();
  }, [user]);

  if (isLoading) {
    return (
      <div className={`${listStyles.list} ${listStyles.loadingState}`}>
        <div className={listStyles.loadingContainer}>
          <div className={listStyles.loadingSpinner}>
            <div className={listStyles.spinnerCircle} />
            <div className={listStyles.spinnerCircle} />
            <div className={listStyles.spinnerCircle} />
          </div>
          <p className={listStyles.loadingMessage}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${listStyles.list} ${listStyles.errorState}`}>
        <div className={listStyles.errorMessage}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (assessedConversations.length === 0) {
    return (
      <p className={listStyles.noHistory}>
        {t('noHistory')}
      </p>
    );
  }

  return (
    <ul className={listStyles.list} role="list">
      {assessedConversations.slice(0, 10).map(conv => (
        <li key={conv.id} className={listStyles.historyItem} role="listitem">
          <div className={listStyles.historyService}>
            {conv.service.toUpperCase()}
          </div>
          <div className={listStyles.historyDate}>
            {new Date(conv.endedAt || conv.startedAt).toLocaleDateString()}
          </div>
          <div className={listStyles.historyXp}>+{conv.xpEarned} XP</div>
        </li>
      ))}
    </ul>
  );
}
