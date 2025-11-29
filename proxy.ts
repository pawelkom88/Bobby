import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Security Proxy (Middleware) for Next.js 16
 *
 * Security improvements:
 * - CWE-602: Server-side route protection (not just client-side)
 * - CWE-1021: Improved CSP configuration
 * - Added CSRF token generation
 */

// Routes that require authentication
const PROTECTED_ROUTES = ['/app'];

// Routes that are always public
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/reset-password', '/app/success'];

/**
 * Generate CSRF token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}

/**
 * Check if a path matches any of the protected routes
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path matches any of the public routes
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    // Still apply security headers for public routes
    const response = NextResponse.next();

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
      `script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.deepgram.com wss://*.deepgram.com https://*.firebaseapp.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.stripe.com",
      "frame-src https://js.stripe.com https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
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

  // Create response
  const response = NextResponse.next();

  // Check for authentication on protected routes
  if (isProtectedRoute(pathname)) {
    // Check for Firebase session cookie
    // Note: Firebase Auth primarily uses client-side tokens, but we can check
    // for a session indicator cookie that the client sets after authentication
    const sessionCookie = request.cookies.get('__session');
    const authIndicator = request.cookies.get('bobby_auth');

    // If no auth indicator, redirect to login
    // The actual token verification happens in API routes
    // This is a first-line defense to prevent unauthenticated page access
    if (!authIndicator && !sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Create response
  const response = NextResponse.next();

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
  // Note: We still need 'unsafe-inline' for scripts and styles due to Next.js/React requirements in static builds
  // but we've removed 'unsafe-eval' and added stricter connect-src
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + Stripe + unsafe-inline (required for Next.js inline scripts in static builds)
    `script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com`,
    // Styles: self + unsafe-inline (required for styled-jsx and inline styles)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: self + data URIs + HTTPS
    "img-src 'self' data: https: blob:",
    // Fonts: self + data URIs
    "font-src 'self' data: https://fonts.gstatic.com",
    // Connections: self + required services
    "connect-src 'self' https://*.deepgram.com wss://*.deepgram.com https://*.firebaseapp.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.stripe.com",
    // Frames: Stripe checkout
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    // Frame ancestors: none (prevent clickjacking)
    "frame-ancestors 'none'",
    // Form actions: self only
    "form-action 'self'",
    // Base URI: self only
    "base-uri 'self'",
    // Object sources: none
    "object-src 'none'",
    // Upgrade insecure requests in production
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - they have their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
