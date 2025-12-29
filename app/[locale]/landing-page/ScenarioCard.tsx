'use client';

import type { Scenario } from './scenarios';
import { ServiceIcon, useServiceLabel, getServiceColor } from './ServiceIcon';
import { useTranslations } from 'next-intl';

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: () => void;
  isActive?: boolean;
}

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
        <ServiceIcon service={scenario.service} className="scenario-card__icon" />
        <span className="scenario-card__service">{serviceLabel}</span>
      </div>

      <blockquote className="scenario-card__situation">
        {scenario.situation}
      </blockquote>

      <div className="scenario-card__divider" aria-hidden="true" />

      <p className="scenario-card__hook">{scenario.hook}</p>
    </button>
  );
}
