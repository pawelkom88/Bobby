'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type TouchEvent,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { scenarioIds, type Scenario } from './scenarios';
import { ScenarioCard } from './ScenarioCard';
import { ScenarioModal } from './ScenarioModal';
import styles from './ScenarioCarousel.module.css';

const SWIPE_THRESHOLD = 50;
const CARDS_DESKTOP = 1;
const CARDS_TABLET = 1;
const CARDS_MOBILE = 1;

export function ScenarioCarousel() {
  const router = useRouter();
  const t = useTranslations('landing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState(CARDS_DESKTOP);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const maxIndex = Math.max(0, scenarioIds.length - visibleCards);

  // Derive effective index - clamp to valid range during render
  // This replaces the useEffect that was updating state when maxIndex changed
  const effectiveIndex = Math.min(currentIndex, maxIndex);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setVisibleCards(CARDS_MOBILE);
      } else if (width < 1024) {
        setVisibleCards(CARDS_TABLET);
      } else {
        setVisibleCards(CARDS_DESKTOP);
      }
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
    }
  };

  const handleCardClick = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartPractice = (scenario: Scenario) => {
    setIsModalOpen(false);
    router.push(`/app/dial?scenario=${scenario.id}`);
  };

  const translateX = -(effectiveIndex * (100 / visibleCards));

  return (
    <section
      id="how-it-works"
      className={styles.section}
      aria-labelledby="scenario-heading"
    >
      <header className={styles.header}>
        <h2 id="scenario-heading" className={styles.title}>
          {t('carousel.title')}
        </h2>
        <p className={styles.subtitle}>
          {t('carousel.subtitle')}
        </p>
      </header>

      <div className={styles.carouselContainer}>
        <button
          type="button"
          className={styles.arrow}
          onClick={goToPrevious}
          disabled={effectiveIndex === 0}
          aria-label={t('carousel.prevAriaLabel')}
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={carouselRef}
          className={styles.carousel}
          role="region"
          aria-label={t('carousel.carouselAriaLabel')}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={styles.carouselTrack}
            style={{
              transform: `translateX(${translateX}%)`,
              transition: prefersReducedMotion ? 'none' : 'transform 0.3s ease',
            }}
          >
            {scenarioIds.map((scenarioId, index) => {
              const scenario: Scenario = {
                id: scenarioId.id,
                service: scenarioId.service,
                situation: t(`scenarios.${scenarioId.id}.situation`),
                hook: t(`scenarios.${scenarioId.id}.hook`),
                description: t(`scenarios.${scenarioId.id}.description`),
                practicePoints: t.raw(`scenarios.${scenarioId.id}.practicePoints`) as string[],
              };
              return (
                <div
                  key={scenario.id}
                  className={styles.carouselSlide}
                  style={{ width: `${100 / visibleCards}%` }}
                >
                  <ScenarioCard
                    scenario={scenario}
                    onClick={() => handleCardClick(scenario)}
                    isActive={
                      index >= effectiveIndex && index < effectiveIndex + visibleCards
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={goToNext}
          disabled={effectiveIndex >= maxIndex}
          aria-label={t('carousel.nextAriaLabel')}
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
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <nav className={styles.pagination} aria-label={t('carousel.paginationAriaLabel')}>
        {Array.from({ length: maxIndex + 1 }).map((_, index) => {
          const isActive = index === effectiveIndex;
          const dotClassName = `${styles.paginationDot} ${
            isActive ? styles.paginationDotActive : ''
          }`.trim();

          return (
            <button
              key={index}
              type="button"
              className={dotClassName}
              onClick={() => setCurrentIndex(index)}
              aria-label={t('carousel.goToSlide', { number: index + 1 })}
              aria-current={isActive ? 'true' : undefined}
            />
          );
        })}
      </nav>

      <ScenarioModal
        scenario={selectedScenario}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStartPractice={handleStartPractice}
      />
    </section>
  );
}
