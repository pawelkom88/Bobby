'use client';

import type { ServiceType } from './scenarios';
import { useTranslations } from 'next-intl';

interface ServiceIconProps {
  service: ServiceType;
  className?: string;
}

export function ServiceIcon({ service, className = '' }: ServiceIconProps) {
const iconProps = {
  className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
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

export function useServiceLabel(service: ServiceType): string {
  const t = useTranslations('services');

  switch (service) {
    case 'ambulance':
      return t('ambulanceService');
    case 'fire':
      return t('fireService');
    case 'police':
      return t('policeService');
  }
}

export function getServiceColor(service: ServiceType): string {
  switch (service) {
    case 'ambulance':
      return '#22c55e';
    case 'fire':
      return '#ef4444';
    case 'police':
      return '#3b82f6';
  }
}
