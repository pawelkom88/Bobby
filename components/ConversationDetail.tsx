'use client';

import { useCallback } from 'react';
import ChatBubble from './ChatBubble';
import type { StoredConversation, Service } from '@/types';

interface ConversationDetailProps {
  conversation: StoredConversation | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
}

function getServiceLabel(service: Service): string {
  switch (service) {
    case 'ambulance':
      return 'Ambulance';
    case 'fire':
      return 'Fire';
    case 'police':
      return 'Police';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
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
  const handleSaveTranscript = useCallback(() => {
    if (!conversation?.messages) return;

    const lines = conversation.messages.map((msg) => {
      const speaker = msg.type === 'agent' ? 'Bobby' : 'You';
      const time = new Date(msg.timestamp).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `[${time}] ${speaker}: ${msg.text}`;
    });

    const header = `Conversation with Bobby - ${getServiceLabel(conversation.service)} Call\n`;
    const date = `Date: ${formatDate(conversation.endedAt || conversation.startedAt)}\n`;
    const separator = '─'.repeat(50) + '\n\n';
    
    const content = header + date + separator + lines.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bobby-conversation-${conversation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversation]);

  if (isLoading) {
    return (
      <div className="conversation-detail conversation-detail--loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-circle" />
            <div className="spinner-circle" />
            <div className="spinner-circle" />
          </div>
          <p className="loading-message">Loading conversation...</p>
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
          <button onClick={onBack} className="conversation-detail__back-btn">
            Go Back
          </button>
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
        <button
          onClick={onBack}
          className="conversation-detail__back-btn"
          aria-label="Go back to conversations"
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
        </button>
        
        <div className="conversation-detail__header-content">
          <h1 className="conversation-detail__title">Your Conversation</h1>
          <p className="conversation-detail__subtitle">
            Review your call with Bobby
          </p>
        </div>
        
        <button
          onClick={handleSaveTranscript}
          className="conversation-detail__save-btn"
          aria-label="Save transcript"
          title="Save transcript as text file"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '18px', height: '18px' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </header>

      <div className="conversation-detail__date">
        {formatDate(conversation.endedAt || conversation.startedAt)}
      </div>

      <div className="conversation-detail__messages">
        {messages.length === 0 ? (
          <div className="conversation-detail__empty">
            <p>No messages in this conversation.</p>
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
