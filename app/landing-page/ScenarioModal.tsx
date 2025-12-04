'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Scenario } from './scenarios';
import { ServiceIcon, getServiceLabel, getServiceColor } from './ServiceIcon';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [onClose]
  );

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

  if (!isOpen || !scenario) return null;

  const serviceColor = getServiceColor(scenario.service);
  const serviceLabel = getServiceLabel(scenario.service);

  return (
    <div
      className="scenario-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="scenario-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={
          {
            '--service-color': serviceColor,
          } as React.CSSProperties
        }
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="scenario-modal__close"
          onClick={onClose}
          aria-label="Close modal"
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

        <header className="scenario-modal__header">
          <ServiceIcon
            service={scenario.service}
            className="scenario-modal__icon"
          />
          <span className="scenario-modal__service">{serviceLabel}</span>
        </header>

        <h2 id="modal-title" className="scenario-modal__title">
          &ldquo;{scenario.situation}&rdquo;
        </h2>

        <section className="scenario-modal__body">
          <h3 className="scenario-modal__section-title">The Scenario:</h3>
          <p className="scenario-modal__description">{scenario.description}</p>

          <h3 className="scenario-modal__section-title">
            What they&apos;ll practice:
          </h3>
          <ul className="scenario-modal__list">
            {scenario.practicePoints.map((point, index) => (
              <li key={index} className="scenario-modal__list-item">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <footer className="scenario-modal__footer">
          <button
            type="button"
            className="scenario-modal__button scenario-modal__button--primary"
            onClick={() => onStartPractice(scenario)}
          >
            Start Practice
          </button>
          <button
            type="button"
            className="scenario-modal__button scenario-modal__button--secondary"
            onClick={onClose}
          >
            Back to Examples
          </button>
        </footer>
      </div>
    </div>
  );
}
