'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { logger } from '@/lib/logger';

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
      <div className="conversation-list conversation-list--loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-circle" />
            <div className="spinner-circle" />
            <div className="spinner-circle" />
          </div>
          <p className="loading-message">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-list conversation-list--error">
        <div className="error-message">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (assessedConversations.length === 0) {
    return (
      <p className="no-history">
        {t('noHistory')}
      </p>
    );
  }

  return (
    <ul className="conversation-list" role="list">
      {assessedConversations.slice(0, 10).map(conv => (
        <li key={conv.id} className="conversation-item" role="listitem">
          <div className="conversation-service">
            {conv.service.toUpperCase()}
          </div>
          <div className="conversation-date">
            {new Date(conv.endedAt || conv.startedAt).toLocaleDateString()}
          </div>
          <div className="conversation-xp">+{conv.xpEarned} XP</div>
        </li>
      ))}
    </ul>
  );
}
