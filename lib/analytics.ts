'use client';

import { getAnalytics, logEvent, setUserProperties, setUserId, Analytics } from 'firebase/analytics';
import { app } from './firebase';

// Types for type safety
interface EventParams {
  [key: string]: string | number | boolean;
}

interface UserProperties {
  user_type?: 'free' | 'premium' | 'enterprise';
  subscription_tier?: string;
  account_age_days?: number;
  preferred_language?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

class AnalyticsService {
  private analytics: Analytics | null = null;
  private isInitialized: boolean = false;
  private hasConsent: boolean = false;
  private pendingEvents: Array<{ name: string; params?: EventParams }> = [];
  
  // Console styling for analytics logs
  private logStyle = 'color: #4285f4; font-weight: bold; font-size: 12px;';

  // Initialize only after consent
  async initialize(hasConsent: boolean): Promise<void> {
    this.hasConsent = hasConsent;
    
    if (typeof window === 'undefined') return;
    
    // In development, just log that analytics would be initialized
    if (process.env.NODE_ENV === 'development') {
      if (hasConsent) {
        console.log('%c📊 Analytics would be initialized (development mode)', this.logStyle);
      }
      return;
    }
    
    if (hasConsent && !this.isInitialized) {
      try {
        // Wait for gtag to be available (race condition fix)
        await this.waitForGtag();
        
        // Initialize Firebase Analytics
        this.analytics = getAnalytics(app);
        this.isInitialized = true;
        
        // Set consent mode
        this.updateConsentMode('granted');
        
        // Process any pending events
        this.processPendingEvents();
        
        console.log('%c📊 Analytics initialized with consent', this.logStyle);
      } catch (error) {
        console.error('%c❌ Failed to initialize analytics:', 'color: #ea4335; font-weight: bold;', error);
      }
    } else if (!hasConsent && this.isInitialized) {
      // Disable analytics if consent revoked
      this.updateConsentMode('denied');
    }
  }

  // Wait for gtag to be available
  private waitForGtag(): Promise<void> {
    return new Promise((resolve) => {
      if (window.gtag) {
        resolve();
        return;
      }
      
      const checkInterval = setInterval(() => {
        if (window.gtag) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
      // Timeout after 5 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval); // Clean up interval to prevent memory leak
        console.warn('%c⚠️ gtag not available after 5 seconds', 'color: #ea4335; font-weight: bold;');
        resolve();
      }, 5000);
    });
  }

  // Update Google's consent mode
  private updateConsentMode(status: 'granted' | 'denied'): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': status,
        'ad_storage': status
      });
    }
  }

  // Validate event name
  private validateEventName(name: string): boolean {
    const regex = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
    const reserved = ['firebase_', 'google_', 'ga_'];
    
    if (!regex.test(name)) {
      console.warn(`%c⚠️ Invalid event name: ${name}`, 'color: #ea4335; font-weight: bold;');
      return false;
    }
    if (reserved.some(prefix => name.startsWith(prefix))) {
      console.warn(`%c⚠️ Event name with reserved prefix: ${name}`, 'color: #ea4335; font-weight: bold;');
      return false;
    }
    
    return true;
  }

  // Core logging method with validation
  private log(eventName: string, params?: EventParams): void {
    // Always log to console in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `%c📈 Analytics Event: ${eventName}`,
        this.logStyle,
        params || ''
      );
    }
    
    // Don't send to analytics in development or without consent
    if (process.env.NODE_ENV === 'development' || !this.hasConsent) {
      // Queue events until consent is given (only in production)
      if (process.env.NODE_ENV !== 'development' && !this.hasConsent) {
        this.pendingEvents.push({ name: eventName, params });
      }
      return;
    }
    
    if (!this.isInitialized || !this.analytics) {
      console.warn('%c⚠️ Analytics not initialized', 'color: #ea4335; font-weight: bold;');
      return;
    }
    
    // Validate event name
    if (!this.validateEventName(eventName)) {
      console.warn(`%c⚠️ Invalid event name: ${eventName}`, 'color: #ea4335; font-weight: bold;');
      return;
    }

    // Validate params count (max 25)
    if (params && Object.keys(params).length > 25) {
      console.warn(`%c⚠️ Too many parameters for event: ${eventName}`, 'color: #ea4335; font-weight: bold;');
      return;
    }

    // Only send to Firebase Analytics in production
    logEvent(this.analytics, eventName, params);
  }

  // Process queued events after consent
  private processPendingEvents(): void {
    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift();
      if (event) {
        this.log(event.name, event.params);
      }
    }
  }

  // ============ USER LIFECYCLE ============
  trackUserSignup(method: 'email' | 'google', userId?: string): void {
    this.log('user_signup', {
      signup_method: method,
      timestamp: Date.now()
    });
    
    if (userId) {
      this.setUserId(userId);
    }
  }

  trackUserLogin(method: 'email' | 'google'): void {
    this.log('user_login', {
      login_method: method,
      timestamp: Date.now()
    });
  }

  trackUserLogout(): void {
    this.log('user_logout', {
      timestamp: Date.now()
    });
    
    // Clear user ID
    if (this.analytics) {
      setUserId(this.analytics, null);
    }
  }

  // ============ NAVIGATION ============
  trackPageView(pagePath: string, pageTitle?: string): void {
    this.log('page_view', {
      page_path: pagePath,
      page_title: pageTitle || pagePath,
      timestamp: Date.now()
    });
  }

  trackSearch(searchTerm: string, resultsCount: number): void {
    this.log('search_performed', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  // ============ FEATURE ENGAGEMENT ============
  trackFeatureUsage(featureName: string, action: 'enabled' | 'disabled' | 'used'): void {
    this.log('feature_interaction', {
      feature_name: featureName,
      action: action,
      timestamp: Date.now()
    });
  }

  trackTutorial(step: string, status: 'started' | 'completed' | 'skipped'): void {
    this.log(`tutorial_${status}`, {
      tutorial_step: step,
      timestamp: Date.now()
    });
  }

  // ============ CONVERSIONS ============
  trackPurchase(transactionId: string, value: number, currency: string, items: any[]): void {
    this.log('purchase_completed', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items_count: items.length
    });
  }

  trackSubscription(plan: string, value: number, period: 'monthly' | 'yearly'): void {
    this.log('subscription_started', {
      plan_name: plan,
      plan_value: value,
      billing_period: period
    });
  }

  // ============ ERRORS ============
  trackError(errorType: string, errorMessage: string, errorLocation?: string): void {
    this.log('error_occurred', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit length
      error_location: errorLocation || 'unknown'
    });
  }

  // ============ USER PROPERTIES ============
  setUserProps(properties: UserProperties): void {
    if (!this.isInitialized || !this.analytics) return;
    setUserProperties(this.analytics, properties);
  }

  setUserId(userId: string): void {
    if (!this.isInitialized || !this.analytics) return;
    setUserId(this.analytics, userId);
  }

  // ============ WEB VITALS ============
  trackWebVital(metric: {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    id: string;
  }): void {
    this.log(metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_rating: metric.rating,
    });
  }

  // ============ UTILITY ============
  enableTracking(): void {
    if (!this.hasConsent) {
      this.initialize(true);
    }
  }

  disableTracking(): void {
    this.hasConsent = false;
    this.updateConsentMode('denied');
  }

  isTrackingEnabled(): boolean {
    // In development, tracking is never actually enabled (only console logs)
    if (process.env.NODE_ENV === 'development') {
      return false;
    }
    return this.hasConsent && this.isInitialized;
  }

  // Public method for custom events
  trackCustomEvent(eventName: string, params?: EventParams): void {
    this.log(eventName, params);
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
