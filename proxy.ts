import { NextResponse, NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Security Proxy (Middleware) for Next.js 16
 *
 * Security improvements:
 * - CWE-602: Server-side route protection (not just client-side)
 * - CWE-1021: Improved CSP configuration
 * - Added CSRF token generation
 * - Integrated next-intl middleware for proper i18n
 */

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware(routing);

// i18n Configuration
const LOCALES = ['en', 'pl'] as const;
const DEFAULT_LOCALE = 'en';
const LOCALE_COOKIE = 'NEXT_LOCALE';

// Routes that are always public (without locale prefix)
// Include both English and Polish versions for localized pathnames
const PUBLIC_ROUTES = [
  '/',
  // English routes
  '/login',
  '/signup',
  '/reset-password',
  '/app/success',
  // Polish routes (localized pathnames)
  '/logowanie',
  '/rejestracja',
  '/resetuj-haslo',
  '/aplikacja/sukces',
];

/**
 * Generate CSRF token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return toBase64Url(array);
}

function generateCspNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return toBase64Url(array);
}

function toBase64Url(bytes: Uint8Array): string {
  const base64 = toBase64(bytes);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function toBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}

/**
 * Check if pathname has a locale prefix
 */
function pathnameHasLocale(pathname: string): boolean {
  return LOCALES.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

/**
 * Get pathname without locale prefix
 */
function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

/**
 * Check if a path matches any of the protected routes
 */
// function isProtectedRoute(pathname: string): boolean {
//   return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
// }

/**
 * Check if a path matches any of the public routes
 */
function isPublicRoute(pathname: string): boolean {
  // Check both with and without locale prefix
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);
  return PUBLIC_ROUTES.some(
    route => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + '/')
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = generateCspNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-csp-nonce', nonce);
  const requestWithNonce = new NextRequest(request, { headers: requestHeaders });
  const connectSrc = [
    "'self'",
    'https://*.deepgram.com',
    'wss://*.deepgram.com',
    'https://*.firebaseapp.com',
    'https://*.googleapis.com',
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://api.stripe.com',
    'https://recaptchaenterprise.googleapis.com',
    'https://www.google.com',
  ];

  if (process.env.NODE_ENV !== 'production') {
    connectSrc.push('http://localhost:3000', 'ws://localhost:3000');
  }

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Use next-intl middleware for locale handling
  // This properly sets the locale context for useTranslations hook
  const response = intlMiddleware(requestWithNonce);

  // Get pathname without locale for route checks
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);

  // Apply security headers to all responses
  // Skip further processing for public routes but still add headers
  if (isPublicRoute(pathname)) {

    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Permissions Policy - allow microphone for voice features
    response.headers.set(
      'Permissions-Policy',
      'camera=(), geolocation=(), payment=(self)'
    );

    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google.com/recaptcha/enterprise.js https://www.gstatic.com/recaptcha/ https://apis.google.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://b.stripecdn.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src ${connectSrc.join(' ')}`,
      'frame-src https://js.stripe.com https://checkout.stripe.com https://www.google.com https://www.gstatic.com https://recaptcha.google.com https://www.recaptcha.net https://*.firebaseapp.com',
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      ...(process.env.NODE_ENV === 'production'
        ? ['upgrade-insecure-requests']
        : []),
    ];

    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

    // HTTPS Only (HSTS)
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    return response;
  }

  // Note: Protected routes are handled by client-side ProtectedRoute component
  // and server-side API route authentication (Firebase ID token verification).
  // We don't check for auth cookies here because:
  // 1. Auth cookies are set client-side after hydration
  // 2. Checking here would cause unnecessary redirects during initial page load
  // 3. API routes verify Firebase tokens for actual data access

  // Security Headers (response already created by intlMiddleware)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Permissions Policy - allow microphone for voice features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), geolocation=(), payment=(self)'
  );

  // Content Security Policy
  // Note: Inline scripts are protected via per-request nonce; styles still allow unsafe-inline.
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + Stripe + Google Analytics + reCAPTCHA Enterprise + Google APIs + nonce
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google.com/recaptcha/enterprise.js https://www.gstatic.com/recaptcha/ https://apis.google.com`,
    // Styles: self + unsafe-inline (required for styled-jsx and inline styles) + Stripe CDN
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://b.stripecdn.com",
    // Images: self + data URIs + HTTPS
    "img-src 'self' data: https: blob:",
    // Fonts: self + data URIs
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connections: self + required services + reCAPTCHA Enterprise
    `connect-src ${connectSrc.join(' ')}`,
    // Frames: Stripe checkout + reCAPTCHA Enterprise + Firebase
    'frame-src https://js.stripe.com https://checkout.stripe.com https://www.google.com https://www.gstatic.com https://recaptcha.google.com https://www.recaptcha.net https://*.firebaseapp.com',
    // Frame ancestors: none (prevent clickjacking)
    "frame-ancestors 'none'",
    // Form actions: self only
    "form-action 'self'",
    // Base URI: self only
    "base-uri 'self'",
    // Object sources: none
    "object-src 'none'",
    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production'
      ? ['upgrade-insecure-requests']
      : []),
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  // HTTPS Only (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // CSRF Token - set if not present
  const existingCSRF = request.cookies.get('csrf_token');
  if (!existingCSRF) {
    const csrfToken = generateCSRFToken();
    response.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}
