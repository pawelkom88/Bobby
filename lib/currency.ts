/**
 * Currency configuration utility
 * Provides dynamic currency support based on locale or environment
 */

import { logger } from '@/lib/logger';

export interface CurrencyConfig {
  symbol: string;
  code: string;
  locale: string;
}

export const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  'en': {
    symbol: '£',
    code: 'GBP',
    locale: 'en-GB'
  },
  'pl': {
    symbol: 'zł',
    code: 'PLN',
    locale: 'pl-PL'
  }
};

/**
 * Get currency configuration for a given locale
 * Falls back to environment variable or default to GBP
 */
export function getCurrencyConfig(locale?: string): CurrencyConfig {
  // Check environment variable first
  const envCurrency = process.env.NEXT_PUBLIC_CURRENCY;
  if (envCurrency) {
    try {
      const currency = JSON.parse(envCurrency);
      return {
        symbol: currency.symbol || '£',
        code: currency.code || 'GBP',
        locale: currency.locale || 'en-GB'
      };
    } catch (e) {
      logger.warn(
        'Invalid NEXT_PUBLIC_CURRENCY format, falling back to default'
      );
    }
  }

  // Use locale-based configuration
  const key = locale || 'en';
  return CURRENCY_CONFIG[key] || CURRENCY_CONFIG['en'];
}

/**
 * Get currency symbol for a given locale
 */
export function getCurrencySymbol(locale?: string): string {
  return getCurrencyConfig(locale).symbol;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: string, locale?: string): string {
  const config = getCurrencyConfig(locale);
  // Remove any existing currency symbols
  const cleanPrice = price.replace(/[£$€zł]/g, '');
  
  // Format based on currency
  if (config.code === 'PLN') {
    // PLN: symbol after value
    return `${cleanPrice}${config.symbol}`;
  } else {
    // GBP and others: symbol before value
    return `${config.symbol}${cleanPrice}`;
  }
}

/**
 * Get the base price in GBP for Stripe processing
 */
export function getBasePrice(price: string): string {
  // Remove any currency symbols and return numeric value
  return price.replace(/[£$€zł]/g, '');
}
