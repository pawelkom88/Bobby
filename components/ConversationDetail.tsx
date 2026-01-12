'use client';

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ChatBubble from './ChatBubble';
import type { StoredConversation } from '@/types';
import CartoonButton from '@/components/CartoonButton';

interface ConversationDetailProps {
  conversation: StoredConversation | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function shouldShowTimestamp(
  currentTimestamp: string,
  previousTimestamp: string | null,
  index: number
): boolean {
  if (index === 0) return false;
  if (!previousTimestamp) return true;

  const current = new Date(currentTimestamp);
  const previous = new Date(previousTimestamp);
  const diffMinutes = (current.getTime() - previous.getTime()) / (1000 * 60);

  return diffMinutes >= 1;
}

export default function ConversationDetail({
  conversation,
  isLoading,
  error,
  onBack,
}: ConversationDetailProps) {
  const t = useTranslations('conversationDetail');
  const tService = useTranslations('services');
  const tCard = useTranslations('conversationCard');
  const locale = useLocale();

  const handleSaveTranscript = useCallback(() => {
    if (!conversation?.messages) return;

    const lines = conversation.messages.map(msg => {
      const speaker =
        msg.type === 'agent'
          ? t('transcript.speaker.bobby')
          : t('transcript.speaker.you');
      const time = new Date(msg.timestamp).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${time}] ${speaker}: ${msg.text}`;
    });

    const header =
      t('transcript.header', {
        service: tService(conversation.service),
        callSuffix: tCard('callSuffix'),
      }) + '\n';
    const date =
      t('transcript.date', {
        date: formatDate(
          conversation.endedAt || conversation.startedAt,
          locale
        ),
      }) + '\n';
    const separator = '─'.repeat(50) + '\n\n';

    const content = header + date + separator + lines.join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t('transcript.filename', { id: conversation.id });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversation, locale, t, tCard, tService]);

  if (isLoading) {
    return (
      <div className="conversation-detail conversation-detail--loading">
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
      <div className="conversation-detail conversation-detail--error">
        <div className="conversation-detail__error">
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
          <CartoonButton onClick={onBack} ariaLabel={t('goBack')}>
            {t('goBack')}
          </CartoonButton>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const messages = conversation.messages || [];

  return (
    <div className="conversation-detail">
      <header className="conversation-detail__header">
        <CartoonButton
          onClick={onBack}
          ariaLabel={t('backToConversationsAria')}
          containerClassName="conversation-detail__back-btn-container"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '24px', height: '24px' }}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </CartoonButton>

        <div className="conversation-detail__header-content">
          <h1 className="conversation-detail__title">{t('title')}</h1>
          <p className="conversation-detail__subtitle">{t('subtitle')}</p>
        </div>

        <button
          onClick={handleSaveTranscript}
          className="conversation-detail__save-btn"
          aria-label={t('saveTranscript')}
          title={t('saveTranscriptTitle')}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '18px', height: '8px' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </header>

      <div className="conversation-detail__date">
        {formatDate(conversation.endedAt || conversation.startedAt, locale)}
      </div>

      <div className="conversation-detail__messages">
        {messages.length === 0 ? (
          <div className="conversation-detail__empty">
            <p>{t('empty')}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showTimestamp = shouldShowTimestamp(
              message.timestamp,
              previousMessage?.timestamp || null,
              index
            );

            return (
              <ChatBubble
                key={`${message.timestamp}-${index}`}
                message={message}
                showTimestamp={showTimestamp}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
