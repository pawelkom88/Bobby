/**
 * Token Verifier
 * Verifies Firebase ID tokens and extracts user information
 */

import 'server-only';

import { DecodedIdToken } from 'firebase-admin/auth';

export interface TokenVerificationResult {
  success: boolean;
  uid?: string;
  decodedToken?: DecodedIdToken;
  error?: string;
}

export class TokenVerificationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}

/**
 * Verifies a Firebase ID token
 * This is a wrapper that will be used with Firebase Admin SDK
 *
 * @param verifyIdTokenFn - Function that verifies the token (from Firebase Admin)
 * @param token - The ID token to verify
 * @returns Result with decoded token or error
 */
export async function verifyToken(
  verifyIdTokenFn: (token: string) => Promise<DecodedIdToken>,
  token: string
): Promise<TokenVerificationResult> {
  // Validate token input
  if (!token || typeof token !== 'string') {
    throw new TokenVerificationError(
      'auth/invalid-token',
      'Invalid or missing token'
    );
  }

  try {
    const decodedToken = await verifyIdTokenFn(token);
    return {
      success: true,
      uid: decodedToken.uid,
      decodedToken,
    };
  } catch (error: unknown) {
    // Map Firebase errors to standard error codes
    const errorCode = mapFirebaseErrorCode(error);
    const errorMessage = mapFirebaseErrorMessage(error);

    throw new TokenVerificationError(errorCode, errorMessage);
  }
}

/**
 * Extracts user ID from a decoded token
 *
 * @param decodedToken - The decoded Firebase ID token
 * @returns User ID (uid)
 * @throws Error if token is invalid
 */
export function extractUserIdFromToken(decodedToken: DecodedIdToken): string {
  if (!decodedToken || !decodedToken.uid) {
    throw new TokenVerificationError(
      'auth/invalid-token',
      'Token does not contain user ID'
    );
  }

  return decodedToken.uid;
}

/**
 * Checks if a token is expired
 *
 * @param decodedToken - The decoded Firebase ID token
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(decodedToken: DecodedIdToken): boolean {
  if (!decodedToken.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return decodedToken.exp < now;
}

/**
 * Maps Firebase error messages to standard error codes
 */
function mapFirebaseErrorCode(error: unknown): string {
  const message = getErrorMessage(error);

  if (message.includes('expired')) {
    return 'auth/id-token-expired';
  }
  if (message.includes('revoked')) {
    return 'auth/id-token-revoked';
  }
  if (message.includes('signature')) {
    return 'auth/invalid-token-signature';
  }
  if (message.includes('malformed') || message.includes('invalid') || message.includes('Illegal')) {
    return 'auth/invalid-token';
  }

  return 'auth/token-verification-failed';
}

/**
 * Maps Firebase error messages to user-friendly messages
 */
function mapFirebaseErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);

  if (message.includes('expired')) {
    return 'Firebase ID token has expired. Get a fresh ID token from your client.';
  }
  if (message.includes('revoked')) {
    return 'Firebase ID token has been revoked.';
  }
  if (message.includes('malformed') || message.includes('invalid')) {
    return 'Invalid Firebase ID token.';
  }
  if (message.includes('signature')) {
    return 'Firebase ID token signature verification failed.';
  }

  return 'Token verification failed.';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
}
