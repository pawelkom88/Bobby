/**
 * Server-side Session Storage
 *
 * Security: CWE-922 - Secure storage of sensitive assessment data
 *
 * This module provides secure server-side session storage using encrypted cookies
 * instead of client-side sessionStorage. This prevents XSS attacks from accessing
 * sensitive data like assessment results and conversation transcripts.
 *
 * Data is encrypted with a server-side secret and stored in httpOnly cookies.
 */

import { cookies } from 'next/headers';
import { encrypt, decrypt } from './encryption';
import { logger } from '@/lib/logger';

const SESSION_COOKIE_PREFIX = 'bobby_session_';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60, // 1 hour
};

export interface AssessmentData {
  assessment: {
    score: number;
    passed: boolean;
    positives: string[];
    improvements: string[];
    warnings: string[];
    metrics: {
      userTurns: number;
      durationSeconds: number;
    };
  };
  passed: boolean;
}

export interface SessionData {
  lastAssessment?: AssessmentData;
  completionId?: string;
  processedCompletionId?: string;
  conversationComplete?: boolean;
}

/**
 * Set a session value
 * Encrypts and stores in httpOnly cookie
 */
export async function setSessionValue(key: string, value: any): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = `${SESSION_COOKIE_PREFIX}${key}`;

  try {
    const encrypted = await encrypt(JSON.stringify(value));
    cookieStore.set(cookieName, encrypted, SESSION_COOKIE_OPTIONS);
  } catch (error) {
    logger.error(`Error setting session value for key ${key}:`, error);
    throw new Error(`Failed to set session value: ${key}`);
  }
}

/**
 * Get a session value
 * Decrypts from httpOnly cookie
 */
export async function getSessionValue<T = any>(key: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieName = `${SESSION_COOKIE_PREFIX}${key}`;

  try {
    const encrypted = cookieStore.get(cookieName)?.value;
    if (!encrypted) {
      return null;
    }

    const decrypted = await decrypt(encrypted);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    logger.error(`Error getting session value for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a session value
 */
export async function deleteSessionValue(key: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = `${SESSION_COOKIE_PREFIX}${key}`;
  cookieStore.delete(cookieName);
}

/**
 * Clear all session values
 */
export async function clearAllSessionValues(): Promise<void> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  for (const cookie of allCookies) {
    if (cookie.name.startsWith(SESSION_COOKIE_PREFIX)) {
      cookieStore.delete(cookie.name);
    }
  }
}

/**
 * Get all session data
 */
export async function getAllSessionData(): Promise<SessionData> {
  const lastAssessment =
    await getSessionValue<AssessmentData>('lastAssessment');
  const completionId = await getSessionValue<string>('completionId');
  const processedCompletionId = await getSessionValue<string>(
    'processedCompletionId'
  );
  const conversationComplete = await getSessionValue<boolean>(
    'conversationComplete'
  );

  return {
    lastAssessment: lastAssessment || undefined,
    completionId: completionId || undefined,
    processedCompletionId: processedCompletionId || undefined,
    conversationComplete: conversationComplete || undefined,
  };
}

/**
 * Set assessment data
 */
export async function setAssessmentData(data: AssessmentData): Promise<void> {
  await setSessionValue('lastAssessment', data);
}

/**
 * Get assessment data
 */
export async function getAssessmentData(): Promise<AssessmentData | null> {
  return getSessionValue<AssessmentData>('lastAssessment');
}

/**
 * Set completion ID
 */
export async function setCompletionId(id: string): Promise<void> {
  await setSessionValue('completionId', id);
}

/**
 * Get completion ID
 */
export async function getCompletionId(): Promise<string | null> {
  return getSessionValue<string>('completionId');
}

/**
 * Set processed completion ID
 */
export async function setProcessedCompletionId(id: string): Promise<void> {
  await setSessionValue('processedCompletionId', id);
}

/**
 * Get processed completion ID
 */
export async function getProcessedCompletionId(): Promise<string | null> {
  return getSessionValue<string>('processedCompletionId');
}

/**
 * Set conversation complete flag
 */
export async function setConversationComplete(
  complete: boolean
): Promise<void> {
  await setSessionValue('conversationComplete', complete);
}

/**
 * Get conversation complete flag
 */
export async function getConversationComplete(): Promise<boolean> {
  const value = await getSessionValue<boolean>('conversationComplete');
  return value ?? false;
}
