'use client';

import NextLink from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { ConversationListItem, Service } from '@/types';
import { useLocale, useTranslations } from 'next-intl';
import styles from './ConversationCard.module.css';

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

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationCard({
  conversation,
}: ConversationCardProps) {
  const tService = useTranslations('services');
  const tCard = useTranslations('conversationCard');
  const locale = useLocale();
  const serviceColor = getServiceColor(conversation.service);
  const endedAtOrStartedAt = conversation.endedAt || conversation.startedAt;

  const ageTierKey =
    conversation.ageTier === 1
      ? 'tier1'
      : conversation.ageTier === 2
        ? 'tier2'
        : conversation.ageTier === 3
          ? 'tier3'
          : 'unknown';

  return (
    <NextLink
      href={`${ROUTES.CHATS}/${conversation.id}`}
      className={styles.card}
      style={{ '--service-color': serviceColor } as React.CSSProperties}
    >
      <div className={styles.iconWrapper}>
        {getServiceIcon(conversation.service)}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.service}>
            {tService(conversation.service)}
          </span>
          <span className={styles.age}>
            {tCard(`ageTier.${ageTierKey}`)}
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.date}>
            {formatDate(endedAtOrStartedAt, locale)}
          </span>
          <span className={styles.time}>
            {formatTime(endedAtOrStartedAt, locale)}
          </span>
          <span className={styles.messages}>
            {conversation.messageCount} {tCard('messages')}
          </span>
        </div>
      </div>

      <div className={styles.arrow}>
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
    </NextLink>
  );
}
