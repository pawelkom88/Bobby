'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslations } from 'next-intl';

interface ParentGateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ParentGateChecks {
  parentGuardian: boolean;
  practiceOnly: boolean;
  noPersonalInfo: boolean;
}

const getDefaultChecks = (): ParentGateChecks => ({
  parentGuardian: false,
  practiceOnly: false,
  noPersonalInfo: false,
});

export default function ParentGateModal({
  isOpen,
  onConfirm,
  onCancel,
}: ParentGateModalProps) {
  const t = useTranslations('dial.parentGate');
  const modalRef = useRef<HTMLDivElement>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [checks, setChecks] = useState<ParentGateChecks>(getDefaultChecks());
  const [error, setError] = useState<string | null>(null);

  const allChecked =
    checks.parentGuardian && checks.practiceOnly && checks.noPersonalInfo;
  const describedBy = error
    ? 'parent-gate-description parent-gate-error'
    : 'parent-gate-description';

  useEffect(() => {
    if (!isOpen) return;

    setChecks(getDefaultChecks());
    setError(null);
    previousActiveElement.current = document.activeElement as HTMLElement;
    firstCheckboxRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
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

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleCheckboxChange =
    (key: keyof ParentGateChecks) => (event: ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      setChecks(prev => {
        const next = { ...prev, [key]: checked };
        if (
          error &&
          next.parentGuardian &&
          next.practiceOnly &&
          next.noPersonalInfo
        ) {
          setError(null);
        }
        return next;
      });
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allChecked) {
      setError(t('error'));
      return;
    }
    setError(null);
    onConfirm();
  };

  return (
    <div className="parent-gate-overlay">
      <div
        ref={modalRef}
        className="parent-gate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-gate-title"
        aria-describedby={describedBy}
      >
        <div className="parent-gate-header">
          <h2 id="parent-gate-title" className="parent-gate-title">
            {t('title')}
          </h2>
          <p id="parent-gate-description" className="parent-gate-description">
            {t('description')}
          </p>
        </div>

        <form className="parent-gate-form" onSubmit={handleSubmit} noValidate>
          <fieldset
            className={`parent-gate-fieldset ${error ? 'parent-gate-fieldset-error' : ''}`}
            aria-describedby={error ? 'parent-gate-error' : undefined}
          >
            <legend className="sr-only">{t('legend')}</legend>
            <label className="parent-gate-checkbox-label">
              <input
                ref={firstCheckboxRef}
                type="checkbox"
                checked={checks.parentGuardian}
                onChange={handleCheckboxChange('parentGuardian')}
                className="parent-gate-checkbox"
                required
                aria-required="true"
                aria-invalid={!!error && !checks.parentGuardian}
                aria-describedby={error ? 'parent-gate-error' : undefined}
              />
              <span>{t('parentGuardian')}</span>
            </label>
            <label className="parent-gate-checkbox-label">
              <input
                type="checkbox"
                checked={checks.practiceOnly}
                onChange={handleCheckboxChange('practiceOnly')}
                className="parent-gate-checkbox"
                required
                aria-required="true"
                aria-invalid={!!error && !checks.practiceOnly}
                aria-describedby={error ? 'parent-gate-error' : undefined}
              />
              <span>{t('practiceOnly')}</span>
            </label>
            <label className="parent-gate-checkbox-label">
              <input
                type="checkbox"
                checked={checks.noPersonalInfo}
                onChange={handleCheckboxChange('noPersonalInfo')}
                className="parent-gate-checkbox"
                required
                aria-required="true"
                aria-invalid={!!error && !checks.noPersonalInfo}
                aria-describedby={error ? 'parent-gate-error' : undefined}
              />
              <span>{t('noPersonalInfo')}</span>
            </label>
          </fieldset>

          {error && (
            <div
              id="parent-gate-error"
              className="parent-gate-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="parent-gate-actions">
            <button type="submit" className="cartoon-btn parent-gate-confirm">
              <span>{t('confirm')}</span>
            </button>
            <button
              type="button"
              className="cartoon-btn parent-gate-cancel"
              onClick={onCancel}
            >
              <span>{t('cancel')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
