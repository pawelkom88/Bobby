'use client';

import {
  getAnalytics,
  logEvent,
  setUserProperties,
  setUserId,
  Analytics,
} from 'firebase/analytics';
import { app } from './firebase';
import { logger } from '@/lib/logger';

// Types for type safety
interface EventParams {
  [key: string]: string | number | boolean;
}

class LazyAnalytics {
  private analytics: Analytics | null = null;
  private isInitialized = false;
  private pendingEvents: Array<{ name: string; params: EventParams }> = [];
  private hasConsent = false;

  constructor() {
    // Check for existing consent
    this.checkExistingConsent();
  }

  // Check if user has already given consent
  private checkExistingConsent(): void {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('analytics_consent');
      this.hasConsent = consent === 'granted';
    }
  }

  // Wait for gtag to be available
  private async waitForGtag(): Promise<void> {
    return new Promise(resolve => {
      const checkGtag = () => {
        if (typeof window !== 'undefined' && window.gtag) {
          resolve();
        } else {
          setTimeout(checkGtag, 50);
        }
      };
      checkGtag();
    });
  }

  // Update consent mode
  private updateConsentMode(consent: string): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consent,
        ad_storage: consent,
        ad_user_data: consent,
        ad_personalization: consent,
      });
    }
  }

  // Initialize analytics
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.hasConsent && !this.isInitialized) {
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

        logger.log(
          '%c✅ Analytics initialized',
          'color: #34a853; font-weight: bold;'
        );
      } catch (error) {
        logger.error(
          '%c❌ Failed to initialize analytics:',
          'color: #ea4335; font-weight: bold;',
          error
        );
      }
    }
  }

  // Grant consent and initialize
  async grantConsent(): Promise<void> {
    this.hasConsent = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', 'granted');
    }
    await this.initialize();
  }

  // Deny consent
  denyConsent(): void {
    this.hasConsent = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', 'denied');
    }
    this.updateConsentMode('denied');
  }

  // Track custom events
  track(eventName: string, params?: EventParams): void {
    if (!this.isInitialized) {
      // Queue event if not initialized
      this.pendingEvents.push({ name: eventName, params: params || {} });
      return;
    }

    // Validate event name
    if (!this.validateEventName(eventName)) {
      return;
    }

    // Validate parameters
    if (params && !this.validateParams(params)) {
      return;
    }

    // Only send to Firebase Analytics in production
    if (process.env.NODE_ENV === 'production' && this.analytics) {
      logEvent(this.analytics, eventName, params);
    } else {
      logger.log(
        `%c📊 Analytics Event: ${eventName}`,
        'color: #4285f4; font-weight: bold;',
        params
      );
    }
  }

  // Process queued events after consent
  private processPendingEvents(): void {
    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift();
      if (event) {
        this.track(event.name, event.params);
      }
    }
  }

  // Validate event name
  private validateEventName(name: string): boolean {
    const regex = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
    const reserved = ['firebase_', 'google_', 'ga_'];

    if (!regex.test(name)) {
      logger.warn(
        `%c⚠️ Invalid event name: ${name}`,
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    if (reserved.some(prefix => name.startsWith(prefix))) {
      logger.warn(
        `%c⚠️ Event name cannot start with reserved prefixes: ${reserved.join(', ')}`,
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    return true;
  }

  // Validate parameters
  private validateParams(params: EventParams): boolean {
    // Check number of parameters
    if (params && Object.keys(params).length > 25) {
      logger.warn(
        `%c⚠️ Too many parameters for event`,
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    // Check parameter values
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.length > 100) {
        logger.warn(
          `%c⚠️ Parameter value too long (max 100 chars): ${key}`,
          'color: #ea4335; font-weight: bold;'
        );
        return false;
      }

      if (
        typeof value === 'number' &&
        (value < -(2 ** 31) || value > 2 ** 31 - 1)
      ) {
        logger.warn(
          `%c⚠️ Parameter value out of range: ${key}`,
          'color: #ea4335; font-weight: bold;'
        );
        return false;
      }
    }

    return true;
  }

  // Set user ID
  setUserId(userId: string): void {
    if (!this.isInitialized || !this.analytics) return;

    if (this.validateUserId(userId)) {
      setUserId(this.analytics, userId);
    }
  }

  // Validate user ID
  private validateUserId(userId: string): boolean {
    if (!userId || typeof userId !== 'string') {
      logger.warn(
        '%c⚠️ User ID must be a non-empty string',
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    if (userId.length > 256) {
      logger.warn(
        '%c⚠️ User ID too long (max 256 chars)',
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    return true;
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized || !this.analytics) return;

    if (this.validateUserProperties(properties)) {
      setUserProperties(this.analytics, properties);
    }
  }

  // Validate user properties
  private validateUserProperties(properties: Record<string, any>): boolean {
    if (!properties || typeof properties !== 'object') {
      logger.warn(
        '%c⚠️ User properties must be an object',
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    if (Object.keys(properties).length > 25) {
      logger.warn(
        '%c⚠️ Too many user properties (max 25)',
        'color: #ea4335; font-weight: bold;'
      );
      return false;
    }

    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' && value.length > 100) {
        logger.warn(
          `%c⚠️ User property value too long (max 100 chars): ${key}`,
          'color: #ea4335; font-weight: bold;'
        );
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const lazyAnalytics = new LazyAnalytics();

// Export convenience functions
export const grantAnalyticsConsent = () => lazyAnalytics.grantConsent();
export const denyAnalyticsConsent = () => lazyAnalytics.denyConsent();
export const trackEvent = (name: string, params?: EventParams) =>
  lazyAnalytics.track(name, params);
export const setAnalyticsUserId = (userId: string) =>
  lazyAnalytics.setUserId(userId);
export const setAnalyticsUserProperties = (properties: Record<string, any>) =>
  lazyAnalytics.setUserProperties(properties);
