'use client';

import ConversationCard from './ConversationCard';
import type { ConversationListItem } from '@/types';

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
  if (isLoading) {
    return (
      <div className="conversation-list conversation-list--loading">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-circle" />
            <div className="spinner-circle" />
            <div className="spinner-circle" />
          </div>
          <p className="loading-message">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-list conversation-list--error">
        <div className="conversation-list__error">
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
      <div className="conversation-list conversation-list--empty">
        <div className="conversation-list__empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9560ED"
            strokeWidth="2"
            style={{ width: '64px', height: '64px', color: '#9ca3af' }}
          >
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            <path d="M7 9h10" />
            <path d="M7 13h6" />
          </svg>
          <h3>No conversations yet</h3>
          <p>
            Complete a call with Bobby to see your conversation history here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map(conversation => (
        <ConversationCard key={conversation.id} conversation={conversation} />
      ))}
    </div>
  );
}
