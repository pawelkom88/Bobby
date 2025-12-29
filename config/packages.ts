/**
 * Package display configuration
 *
 * This file contains client-side display information for available packages.
 * The actual Stripe Price IDs and credit amounts for processing remain server-side
 * in app/api/checkout_sessions/route.ts
 */

import { formatPrice } from '@/lib/currency';

export type PackType = 'rookie' | 'hero';

export interface DisplayPackage {
  id: PackType;
  name: string;
  credits: number;
  displayPrice: string;
  basePrice: string; // Price without currency symbol
  prices: {
    en: string; // GBP price
    pl: string; // PLN price
  };
  description: string;
  // features: string[];
  popular?: boolean;
}

export const DISPLAY_PACKAGES: Record<PackType, DisplayPackage> = {
  rookie: {
    id: 'rookie',
    name: 'Rookie Pack',
    credits: 1,
    basePrice: '2.99',
    displayPrice: '£2.99',
    prices: {
      en: '2.99',
      pl: '23.00'
    },
    description: '1 practice call',
  },
  hero: {
    id: 'hero',
    name: 'Hero Pack',
    credits: 2,
    basePrice: '4.99',
    displayPrice: '£4.99',
    prices: {
      en: '4.99',
      pl: '37.00'
    },
    description: '2 practice calls',
    popular: true,
  },
};
