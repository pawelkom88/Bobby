'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsService } from '@/lib/analytics';

// Auto-track page views
export function usePageTracking(): void {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only track if path actually changed
    if (pathname && pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      
      // Small delay to ensure title is updated
      const timer = setTimeout(() => {
        analyticsService.trackPageView(
          pathname,
          document.title
        );
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);
}

// Track feature usage
export function useFeatureTracking() {
  const trackFeature = useCallback((feature: string, action: 'enabled' | 'disabled' | 'used') => {
    analyticsService.trackFeatureUsage(feature, action);
  }, []);

  return { trackFeature };
}

// Track button clicks
export function useClickTracking() {
  const trackClick = useCallback((elementName: string, category?: string) => {
    analyticsService.trackCustomEvent('button_click', {
      element_name: elementName,
      category: category || 'general'
    });
  }, []);

  return { trackClick };
}

// Track search functionality
export function useSearchTracking() {
  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    analyticsService.trackSearch(searchTerm, resultsCount);
  }, []);

  return { trackSearch };
}

// Track form submissions
export function useFormTracking() {
  const trackFormSubmit = useCallback((formName: string, success: boolean) => {
    analyticsService.trackCustomEvent('form_submit', {
      form_name: formName,
      success: success
    });
  }, []);

  const trackFormFieldError = useCallback((formName: string, fieldName: string, error: string) => {
    analyticsService.trackCustomEvent('form_field_error', {
      form_name: formName,
      field_name: fieldName,
      error_message: error
    });
  }, []);

  return { trackFormSubmit, trackFormFieldError };
}

// Track authentication events
export function useAuthTracking() {
  const trackLogin = useCallback((method: 'email' | 'google', userId?: string) => {
    analyticsService.trackUserLogin(method);
    if (userId) {
      analyticsService.setUserId(userId);
    }
  }, []);

  const trackSignup = useCallback((method: 'email' | 'google', userId?: string) => {
    analyticsService.trackUserSignup(method, userId);
  }, []);

  const trackLogout = useCallback(() => {
    analyticsService.trackUserLogout();
  }, []);

  return { trackLogin, trackSignup, trackLogout };
}

// Track tutorial/onboarding progress
export function useTutorialTracking() {
  const trackStep = useCallback((step: string, status: 'started' | 'completed' | 'skipped') => {
    analyticsService.trackTutorial(step, status);
  }, []);

  return { trackStep };
}

// Track errors
export function useErrorTracking() {
  const trackError = useCallback((errorType: string, errorMessage: string, errorLocation?: string) => {
    analyticsService.trackError(errorType, errorMessage, errorLocation);
  }, []);

  return { trackError };
}

// Track purchase/subscription events
export function useConversionTracking() {
  const trackPurchase = useCallback((transactionId: string, value: number, currency: string, items: any[]) => {
    analyticsService.trackPurchase(transactionId, value, currency, items);
  }, []);

  const trackSubscription = useCallback((plan: string, value: number, period: 'monthly' | 'yearly') => {
    analyticsService.trackSubscription(plan, value, period);
  }, []);

  return { trackPurchase, trackSubscription };
}

// Track custom events
export function useCustomEventTracking() {
  const trackEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    analyticsService.trackCustomEvent(eventName, params);
  }, []);

  return { trackEvent };
}
