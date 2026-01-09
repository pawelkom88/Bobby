import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import { ScenarioCarousel } from '../../app/[locale]/landing-page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock next/image properly as a React component
vi.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', {
      src: props.src,
      alt: props.alt,
      width: props.width,
      height: props.height,
      className: props.className,
    });
  },
}));

// Import the component after mocks

const enMessages = {
  landing: {
    carousel: {
      title: 'Practice Emergency Scenarios',
      subtitle: 'Learn to handle different situations',
      prevAriaLabel: 'Previous scenario',
      nextAriaLabel: 'Next scenario',
      carouselAriaLabel: 'Scenario carousel',
      paginationAriaLabel: 'Carousel pagination',
      goToSlide: 'Go to slide {number}',
      cardAriaLabel: '{situation}. {hook}. Click to learn more.',
    },
    modal: {
      closeAriaLabel: 'Close modal',
      practiceLabel: 'Practice this scenario',
      learnLabel: 'What your child will learn:',
    },
    scenarios: {
      1: {
        situation: 'Medical Emergency',
        hook: 'Someone needs help',
        description: 'Learn to call for medical help',
        practicePoints: ['Stay calm', 'Give clear info', 'Follow instructions'],
      },
      2: {
        situation: 'Fire Emergency',
        hook: 'There is a fire',
        description: 'Learn to report a fire',
        practicePoints: ['Get to safety', 'Call 911', 'Give address'],
      },
      3: {
        situation: 'Police Emergency',
        hook: 'Someone is in danger',
        description: 'Learn to call police',
        practicePoints: ['Stay safe', 'Describe situation', 'Give location'],
      },
      4: {
        situation: 'Ambulance scenario 2',
        hook: 'Hook 4',
        description: 'Description 4',
        practicePoints: ['Point 1'],
      },
      5: {
        situation: 'Fire scenario 2',
        hook: 'Hook 5',
        description: 'Description 5',
        practicePoints: ['Point 1'],
      },
      6: {
        situation: 'Ambulance scenario 3',
        hook: 'Hook 6',
        description: 'Description 6',
        practicePoints: ['Point 1'],
      },
    },
  },
  services: {
    ambulance: 'Ambulance',
    fire: 'Fire',
    police: 'Police',
    ambulanceService: 'Ambulance Service',
    fireService: 'Fire Service',
    policeService: 'Police Service',
  },
};

// Store original window properties
let originalInnerWidth: number;

function renderCarousel() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScenarioCarousel />
    </NextIntlClientProvider>
  );
}

describe('ScenarioCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    originalInnerWidth = window.innerWidth;

    // Mock window.matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
  });

  describe('Navigation', () => {
    it('should render with first scenario visible', () => {
      renderCarousel();

      expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
      expect(
        screen.getByText('Practice Emergency Scenarios')
      ).toBeInTheDocument();
    });

    it('should navigate to next scenario when next button is clicked', () => {
      renderCarousel();

      const nextButton = screen.getByLabelText('Next scenario');
      fireEvent.click(nextButton);

      // Check that navigation occurred (pagination dot should change)
      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });
      expect(paginationDots[1]).toHaveAttribute('aria-current', 'true');
    });

    it('should navigate to previous scenario when prev button is clicked', () => {
      renderCarousel();

      // First go to second slide
      const nextButton = screen.getByLabelText('Next scenario');
      fireEvent.click(nextButton);

      // Then go back
      const prevButton = screen.getByLabelText('Previous scenario');
      fireEvent.click(prevButton);

      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });
      expect(paginationDots[0]).toHaveAttribute('aria-current', 'true');
    });

    it('should disable prev button at first slide', () => {
      renderCarousel();

      const prevButton = screen.getByLabelText('Previous scenario');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button at last slide', () => {
      renderCarousel();

      // Navigate to last slide
      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });
      fireEvent.click(paginationDots[paginationDots.length - 1]);

      const nextButton = screen.getByLabelText('Next scenario');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Keyboard navigation', () => {
    it('should navigate with arrow keys', () => {
      renderCarousel();

      const carousel = screen.getByRole('region', {
        name: 'Scenario carousel',
      });

      // Navigate right
      fireEvent.keyDown(carousel, { key: 'ArrowRight' });

      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });
      expect(paginationDots[1]).toHaveAttribute('aria-current', 'true');

      // Navigate left
      fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
      expect(paginationDots[0]).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Pagination', () => {
    it('should navigate directly via pagination dots', () => {
      renderCarousel();

      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });

      // Click on third dot
      fireEvent.click(paginationDots[2]);

      expect(paginationDots[2]).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Index clamping behavior', () => {
    it('should clamp currentIndex when navigating beyond maxIndex', () => {
      renderCarousel();

      // Navigate to the last slide
      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });
      const lastIndex = paginationDots.length - 1;
      fireEvent.click(paginationDots[lastIndex]);

      // Verify we're at the last slide
      expect(paginationDots[lastIndex]).toHaveAttribute('aria-current', 'true');

      // Try to go further (should not be possible)
      const nextButton = screen.getByLabelText('Next scenario');
      expect(nextButton).toBeDisabled();
    });

    it('should maintain valid index after multiple navigations', () => {
      renderCarousel();

      // Navigate forward multiple times
      const nextButton = screen.getByLabelText('Next scenario');
      for (let i = 0; i < 10; i++) {
        if (!nextButton.hasAttribute('disabled')) {
          fireEvent.click(nextButton);
        }
      }

      // Should be at max index, next should be disabled
      expect(nextButton).toBeDisabled();

      // Navigate backward multiple times
      const prevButton = screen.getByLabelText('Previous scenario');
      for (let i = 0; i < 10; i++) {
        if (!prevButton.hasAttribute('disabled')) {
          fireEvent.click(prevButton);
        }
      }

      // Should be at 0, prev should be disabled
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Responsive behavior', () => {
    it('should show correct number of pagination dots based on scenarios', () => {
      renderCarousel();

      // With 6 scenarios and 1 visible card, should have 6 pagination dots
      const paginationDots = screen.getAllByRole('button', {
        name: /Go to slide/,
      });
      expect(paginationDots.length).toBe(6);
    });
  });

  describe('Reduced motion preference', () => {
    it('should respect prefers-reduced-motion', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderCarousel();

      // Component should render without animation
      // This is verified by the carousel track having transition: none
      // We're testing that it renders without error when reduced motion is preferred
      expect(
        screen.getByText('Practice Emergency Scenarios')
      ).toBeInTheDocument();
    });
  });
});
