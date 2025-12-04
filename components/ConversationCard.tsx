'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { ConversationListItem, Service } from '@/types';

interface ConversationCardProps {
  conversation: ConversationListItem;
}

function getServiceIcon(service: Service): React.ReactNode {
  const iconProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    style: { width: '24px', height: '24px' },
  };

  switch (service) {
    case 'ambulance':
      return (
        <svg {...iconProps}>
          <path d="M10 10H6" />
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14" />
          <path d="M8 8v4" />
          <circle cx="17" cy="18" r="2" />
          <circle cx="7" cy="18" r="2" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...iconProps}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case 'police':
      return (
        <svg {...iconProps}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
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

function getServiceColor(service: Service): string {
  switch (service) {
    case 'ambulance':
      return '#22c55e';
    case 'fire':
      return '#ef4444';
    case 'police':
      return '#3b82f6';
  }
}

function getAgeTierLabel(ageTier: number): string {
  switch (ageTier) {
    case 1:
      return '4-6 years';
    case 2:
      return '7-10 years';
    case 3:
      return '11-13 years';
    default:
      return 'Unknown';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationCard({ conversation }: ConversationCardProps) {
  const serviceColor = getServiceColor(conversation.service);

  return (
    <Link
      href={`${ROUTES.CHATS}/${conversation.id}`}
      className="conversation-card"
      style={{ '--service-color': serviceColor } as React.CSSProperties}
    >
      <div className="conversation-card__icon-wrapper">
        {getServiceIcon(conversation.service)}
      </div>
      
      <div className="conversation-card__content">
        <div className="conversation-card__header">
          <span className="conversation-card__service">
            {getServiceLabel(conversation.service)} Call
          </span>
          <span className="conversation-card__age">
            {getAgeTierLabel(conversation.ageTier)}
          </span>
        </div>
        
        <div className="conversation-card__meta">
          <span className="conversation-card__date">
            {formatDate(conversation.endedAt || conversation.startedAt)}
          </span>
          <span className="conversation-card__time">
            {formatTime(conversation.endedAt || conversation.startedAt)}
          </span>
          <span className="conversation-card__messages">
            {conversation.messageCount} messages
          </span>
        </div>
      </div>
      
      <div className="conversation-card__arrow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '20px', height: '20px' }}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}
