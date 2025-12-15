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

const SWIPE_THRESHOLD = 50;
const CARDS_DESKTOP = 3;
const CARDS_TABLET = 2;
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

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

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

  const translateX = -(currentIndex * (100 / visibleCards));

  return (
    <section
      id="how-it-works"
      className="scenario-section"
      aria-labelledby="scenario-heading"
    >
      <header className="scenario-section__header">
        <h2 id="scenario-heading" className="scenario-section__title">
          {t('carousel.title')}
        </h2>
        <p className="scenario-section__subtitle">
          {t('carousel.subtitle')}
        </p>
      </header>

      <div className="scenario-carousel-container">
        <button
          type="button"
          className="scenario-carousel__arrow scenario-carousel__arrow--prev"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
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
          className="scenario-carousel"
          role="region"
          aria-label={t('carousel.carouselAriaLabel')}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="scenario-carousel__track"
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
                  className="scenario-carousel__slide"
                  style={{ width: `${100 / visibleCards}%` }}
                >
                  <ScenarioCard
                    scenario={scenario}
                    onClick={() => handleCardClick(scenario)}
                    isActive={
                      index >= currentIndex && index < currentIndex + visibleCards
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="scenario-carousel__arrow scenario-carousel__arrow--next"
          onClick={goToNext}
          disabled={currentIndex >= maxIndex}
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

      <nav className="scenario-pagination" aria-label="Carousel pagination">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            type="button"
            className={`scenario-pagination__dot ${
              index === currentIndex ? 'scenario-pagination__dot--active' : ''
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={t('carousel.goToSlide', { number: index + 1 })}
            aria-current={index === currentIndex ? 'true' : undefined}
          />
        ))}
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
