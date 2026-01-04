'use client';

import type { Scenario } from './scenarios';
import { ServiceIcon, useServiceLabel, getServiceColor } from './ServiceIcon';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import styles from './ScenarioCard.module.css';

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: () => void;
  isActive?: boolean;
}

const scenarioImages = {
  1: '/carousel-image-1.webp',
  2: '/carousel-image-3.webp',
  3: '/carousel-image-2.webp',
  4: '/carousel-image-4.webp',
  5: '/carousel-image-5.webp',
  6: '/carousel-image-6.webp',
} as const;

const fallbackImage = '/carousel-image-1.webp';

const getScenarioImage = (scenarioId: number): string => {
  return (
    scenarioImages[scenarioId as keyof typeof scenarioImages] || fallbackImage
  );
};

export function ScenarioCard({
  scenario,
  onClick,
  isActive = false,
}: ScenarioCardProps) {
  const t = useTranslations('landing');
  const serviceColor = getServiceColor(scenario.service);
  const serviceLabel = useServiceLabel(scenario.service);

  const buttonClassName = `${styles.card} ${
    isActive ? styles.cardActive : ''
  }`.trim();

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      aria-label={t('carousel.cardAriaLabel', {
        situation: scenario.situation,
        hook: scenario.hook,
      })}
      style={
        {
          '--service-color': serviceColor,
        } as React.CSSProperties
      }
    >
      <div className={styles.header}>
        <ServiceIcon
          service={scenario.service}
          className={styles.icon}
        />
        <span className={styles.service}>{serviceLabel}</span>
      </div>

      <div>
        <Image
          className={styles.cardImage}
          src={getScenarioImage(scenario.id)}
          alt={scenario.situation}
          width={200}
          height={200}
          loading="lazy"
          sizes="(max-width: 768px) 150px, 200px"
          onError={e => {
            const target = e.target as HTMLImageElement;
            if (target.src !== fallbackImage) {
              target.src = fallbackImage;
            }
          }}
        />
      </div>

      <blockquote className={styles.situation}>
        {scenario.situation}
      </blockquote>

      <div className={styles.divider} aria-hidden="true" />

      <p className={styles.hook}>{scenario.hook}</p>
    </button>
  );
}
