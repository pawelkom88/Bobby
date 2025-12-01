/**
 * Package display configuration
 *
 * This file contains client-side display information for available packages.
 * The actual Stripe Price IDs and credit amounts for processing remain server-side
 * in app/api/checkout_sessions/route.ts
 */

export type PackType = 'responder' | 'hero';

export interface DisplayPackage {
  id: PackType;
  name: string;
  credits: number;
  displayPrice: string;
  description: string;
  // features: string[];
  popular?: boolean;
}

export const DISPLAY_PACKAGES: Record<PackType, DisplayPackage> = {
  responder: {
    id: 'responder',
    name: 'Responder Pack',
    credits: 2,
    displayPrice: '£2.99',
    description: '2 practice calls',
  },
  hero: {
    id: 'hero',
    name: 'Hero Pack',
    credits: 5,
    displayPrice: '£4.99',
    description: '5 practice calls',
    popular: true,
  },
};
