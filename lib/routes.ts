/**
 * Central route configuration for the application
 * Use these constants instead of hardcoded strings for navigation
 */
export const ROUTES = {
  HOME: '/',
  APP: '/app',
  YOUR_AGE: '/app/your-age',
  CHOOSE_EMERGENCY: '/app/choose-emergency',
  DIAL: '/app/dial',
  CONVERSATION: '/app/conversation',
  COMPLETION: '/app/completion',
  ACHIEVEMENTS: '/achievements',
  SETTINGS: '/settings',
  CONTACT: '/contact',
  FAQ: '/faq',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
