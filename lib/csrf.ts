/**
 * CSRF Protection Utilities
 * 
 * Security: CWE-352 - Cross-Site Request Forgery prevention
 * 
 * This module provides CSRF token generation and validation for
 * state-changing API endpoints.
 */

import 'server-only';

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}

/**
 * Get the CSRF token from cookies (server-side)
 */
export async function getCSRFTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from request
 * 
 * Compares the token from the request header with the token stored in cookies.
 * Uses timing-safe comparison to prevent timing attacks.
 * 
 * @param request - The incoming request
 * @returns true if valid, false otherwise
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!headerToken) {
    return false;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  if (!cookieToken) {
    return false;
  }

  // Timing-safe comparison
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

/**
 * CSRF validation middleware helper
 * 
 * Use this in API routes that perform state-changing operations:
 * 
 * ```typescript
 * import { requireCSRF } from '@/lib/csrf';
 * 
 * export async function POST(request: NextRequest) {
 *   const csrfError = await requireCSRF(request);
 *   if (csrfError) return csrfError;
 *   
 *   // Continue with request handling...
 * }
 * ```
 */
export async function requireCSRF(request: NextRequest): Promise<Response | null> {
  // Skip CSRF validation for:
  // 1. GET, HEAD, OPTIONS requests (safe methods)
  // 2. Requests with valid Firebase ID token (already authenticated)
  const method = request.method.toUpperCase();
  
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null; // No CSRF check needed for safe methods
  }

  // Check for Firebase auth token - if present and valid, CSRF is less critical
  // because the request is already authenticated with a bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Request has auth token, CSRF check is optional
    // The auth token itself provides protection against CSRF
    return null;
  }

  // For requests without auth token, require CSRF token
  const isValid = await validateCSRFToken(request);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing CSRF token' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

/**
 * Get CSRF token for client-side use
 * 
 * This should be called from a server component or API route
 * and passed to the client for inclusion in requests.
 */
export async function getClientCSRFToken(): Promise<string> {
  const existingToken = await getCSRFTokenFromCookies();
  
  if (existingToken) {
    return existingToken;
  }

  // Generate new token if none exists
  return generateCSRFToken();
}
