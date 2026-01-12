'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { Scenario } from './scenarios';
import { ServiceIcon, useServiceLabel, getServiceColor } from './ServiceIcon';
import styles from './ScenarioModal.module.css';

interface ScenarioModalProps {
  scenario: Scenario | null;
  isOpen: boolean;
  onClose: () => void;
  onStartPractice: (scenario: Scenario) => void;
}

export function ScenarioModal({
  scenario,
  isOpen,
  onClose,
  onStartPractice,
}: ScenarioModalProps) {
  const t = useTranslations('scenarioModal');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Always call hooks before any early returns
  const serviceLabel = useServiceLabel(scenario?.service || 'ambulance');
  const serviceColor = getServiceColor(scenario?.service || 'ambulance');

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }

    if (event.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !scenario || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
        style={
          {
            '--service-color': serviceColor,
          } as React.CSSProperties
        }
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={t('closeModal')}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <header className={styles.header}>
          <ServiceIcon service={scenario.service} className={styles.icon} />
          <span className={styles.service}>{serviceLabel}</span>
        </header>

        <h2 id="modal-title" className={styles.title}>
          &ldquo;{scenario.situation}&rdquo;
        </h2>

        <section className={styles.body}>
          <h3 className={styles.sectionTitle}>{t('scenarioTitle')}</h3>
          <p className={styles.description}>{scenario.description}</p>

          <h3 className={styles.sectionTitle}>{t('practiceTitle')}</h3>
          <ul className={styles.list}>
            {scenario.practicePoints.map((point, index) => (
              <li key={index} className={styles.listItem}>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <footer className={styles.footer}>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => onStartPractice(scenario)}
          >
            {t('startPractice')}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={onClose}
          >
            {t('backToExamples')}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
