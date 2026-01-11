'use client';

import { useTranslations } from 'next-intl';
import { useAssessedConversations } from '@/hooks/queries/useAssessedConversations';
import listStyles from './ConversationList.module.css';

export default function TrainingHistorySection() {
  const t = useTranslations('trainingHistory');
  const { data, isLoading, error } = useAssessedConversations();
  const assessedConversations = data || [];

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
          <p>{t('loadError')}</p>
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
