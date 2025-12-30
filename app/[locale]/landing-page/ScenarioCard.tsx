'use client';

import type { Scenario } from './scenarios';
import { ServiceIcon, useServiceLabel, getServiceColor } from './ServiceIcon';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

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

  return (
    <button
      type="button"
      className={`scenario-card ${isActive ? 'scenario-card--active' : ''}`}
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
      <div className="scenario-card__header">
        <ServiceIcon
          service={scenario.service}
          className="scenario-card__icon"
        />
        <span className="scenario-card__service">{serviceLabel}</span>
      </div>

      <>
        <div className="scenario-card__image-container">
          <Image
            className="scenario-card__image"
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

        <blockquote className="scenario-card__situation">
          {scenario.situation}
        </blockquote>
      </>

      <div className="scenario-card__divider" aria-hidden="true" />

      <p className="scenario-card__hook">{scenario.hook}</p>
    </button>
  );
}
