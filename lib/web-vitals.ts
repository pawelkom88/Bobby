'use client';

import { logger } from '@/lib/logger';
import { analyticsService } from './analytics';

// Analytics log styling to match analytics.ts
const analyticsLogStyle = 'color: #4285f4; font-weight: bold; font-size: 12px;';

/**
 * Web Vitals monitoring utility
 * Tracks Core Web Vitals (LCP, FID, CLS, FCP, TTFB) and reports them
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function reportMetric(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%c⚡ Web Vitals [${metric.name}]:`,
      analyticsLogStyle,
      {
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      }
    );
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Use AnalyticsService instead of direct gtag
    analyticsService.trackWebVital(metric);
  }
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
function measureLCP() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      const metric: WebVitalsMetric = {
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
        delta: lastEntry.renderTime || lastEntry.loadTime,
        id: `v1-${Date.now()}-${Math.random()}`,
      };
      
      reportMetric(metric);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    // Silently fail if not supported
  }
}

/**
 * Measure First Input Delay (FID)
 */
function measureFID() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        const fidEntry = entry as any;
        const metric: WebVitalsMetric = {
          name: 'FID',
          value: fidEntry.processingStart - fidEntry.startTime,
          rating: getRating('FID', fidEntry.processingStart - fidEntry.startTime),
          delta: fidEntry.processingStart - fidEntry.startTime,
          id: `v1-${Date.now()}-${Math.random()}`,
        };
        
        reportMetric(metric);
        break;
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    // Silently fail if not supported
  }
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
function measureCLS() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const clsEntry = entry as any;
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value;
        }
      }
      
      const metric: WebVitalsMetric = {
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: `v1-${Date.now()}-${Math.random()}`,
      };
      
      reportMetric(metric);
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    // Report final CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const metric: WebVitalsMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          delta: clsValue,
          id: `v1-${Date.now()}-${Math.random()}`,
        };
        reportMetric(metric);
      }
    });
  } catch (error) {
    // Silently fail if not supported
  }
}

/**
 * Measure First Contentful Paint (FCP)
 */
function measureFCP() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          const metric: WebVitalsMetric = {
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: `v1-${Date.now()}-${Math.random()}`,
          };
          
          reportMetric(metric);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    // Silently fail if not supported
  }
}

/**
 * Measure Time to First Byte (TTFB)
 */
function measureTTFB() {
  if (typeof window === 'undefined') return;

  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as any;
    
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      
      const metric: WebVitalsMetric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        delta: ttfb,
        id: `v1-${Date.now()}-${Math.random()}`,
      };
      
      reportMetric(metric);
    }
  } catch (error) {
    // Silently fail if not supported
  }
}

/**
 * Initialize all Web Vitals measurements
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Wait for page to be interactive
  if (document.readyState === 'complete') {
    measureAllVitals();
  } else {
    window.addEventListener('load', measureAllVitals);
  }
}

function measureAllVitals() {
  measureLCP();
  measureFID();
  measureCLS();
  measureFCP();
  measureTTFB();
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
