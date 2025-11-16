/**
 * ElevenLabs Agent Authentication
 * 
 * Provides secure authentication for ElevenLabs agents using:
 * 1. Direct connection (development)
 * 2. Signed URL approach (production - mobile/web)
 * 
 * Reference: https://elevenlabs.io/docs/agents-platform/security
 */

import { logger } from './logger';

export type AuthMethod = 'direct' | 'signed-url';

/**
 * Get the authentication method based on environment
 */
export function getAuthMethod(): AuthMethod {
  // Use signed URL in production, direct connection in development
  if (process.env.NODE_ENV === 'production' && process.env.ELEVENLABS_API_KEY) {
    return 'signed-url';
  }
  return 'direct';
}

/**
 * Get signed URL from backend API route
 * 
 * This approach:
 * - Keeps API key secure on server
 * - Generates short-lived signed URLs
 * - Works for web and mobile apps
 */
export async function getSignedUrl(): Promise<string> {
  try {
    logger.info('Requesting signed URL from backend');

    const response = await fetch('/api/get-signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get signed URL');
    }

    const { signedUrl } = await response.json();
    
    if (!signedUrl) {
      throw new Error('No signed URL in response');
    }

    logger.info('Signed URL obtained successfully');
    return signedUrl;
  } catch (error) {
    logger.error('Error getting signed URL', error);
    throw error;
  }
}

/**
 * Validate domain for allowlist approach
 * This is a client-side helper for development/debugging
 */
export function validateDomain(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const hostname = window.location.hostname;
  const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || 'localhost').split(',');
  
  const isAllowed = allowedDomains.some(domain => {
    const pattern = domain.replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`).test(hostname);
  });

  if (!isAllowed) {
    logger.warn(`Domain ${hostname} not in allowlist`, { allowedDomains });
  }

  return isAllowed;
}

/**
 * Initialize agent with appropriate authentication
 */
export async function initializeAgentAuth(): Promise<{ agentId: string; signedUrl?: string }> {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!agentId) {
    throw new Error('Agent ID not configured');
  }

  const authMethod = getAuthMethod();
  logger.info('Initializing agent auth', { authMethod });

  if (authMethod === 'signed-url') {
    // Production: Use signed URL
    try {
      const signedUrl = await getSignedUrl();
      return { agentId, signedUrl };
    } catch (error) {
      logger.error('Failed to get signed URL, falling back to direct', error);
      // Fall back to direct if signed URL fails
      return { agentId };
    }
  }

  // Development: Direct connection
  validateDomain();
  return { agentId };
}

