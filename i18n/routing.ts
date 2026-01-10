import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './locales';

/**
 * Pathnames configuration
 * TODO: Re-enable localized pathnames when Polish locale is ready
 * For now, using simple string paths (English only)
 */
export const pathnames = {
  '/': '/',
  '/contact': '/contact',
  '/faq': '/faq',
  '/login': '/login',
  '/signup': '/signup',
  '/forgot-password': '/forgot-password',
  '/reset-password': '/reset-password',
  '/app': '/app',
  '/app/achievements': '/app/achievements',
  '/app/chats': '/app/chats',
  '/app/chats/[conversationId]': '/app/chats/[conversationId]',
  '/app/choose-emergency': '/app/choose-emergency',
  '/app/completion': '/app/completion',
  '/app/beta-feedback': '/app/beta-feedback',
  '/app/conversation': '/app/conversation',
  '/app/dial': '/app/dial',
  '/app/preview': '/app/preview',
  '/app/select-package': '/app/select-package',
  '/app/settings': '/app/settings',
  '/app/success': '/app/success',
  '/app/your-age': '/app/your-age',
  '/privacy-policy': '/privacy-policy',
  '/cookies-policy': '/cookies-policy',
  '/terms-conditions': '/terms-conditions',
  '/safety-privacy': '/safety-privacy',
  '/parent-guide': '/parent-guide',
  '/blog': '/blog',
  '/blog/[slug]': '/blog/[slug]',
} as const;

export type AppPathname = keyof typeof pathnames;

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  pathnames,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
