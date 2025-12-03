import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Result of token extraction
 */
export type TokenExtractionResult = {
  success: true;
  token: string;
} | {
  success: false;
  error: 'missing_header' | 'invalid_format' | 'empty_token';
  message: string;
};

/**
 * Extract Bearer token from Authorization header with robust validation
 * 
 * Handles edge cases:
 * - Missing Authorization header
 * - Case-insensitive "bearer" prefix
 * - Extra spaces before/after token
 * - Empty token after "Bearer "
 * 
 * @param request - The incoming request
 * @returns TokenExtractionResult with token or error details
 */
export function extractBearerToken(request: NextRequest): TokenExtractionResult {
  const authHeader = request.headers.get('authorization');
  
  // Check for missing header
  if (!authHeader) {
    return {
      success: false,
      error: 'missing_header',
      message: 'Missing authorization header',
    };
  }

  // Trim whitespace and check for Bearer prefix (case-insensitive)
  const trimmedHeader = authHeader.trim();
  const bearerPrefix = 'bearer ';
  
  if (!trimmedHeader.toLowerCase().startsWith(bearerPrefix)) {
    return {
      success: false,
      error: 'invalid_format',
      message: 'Authorization header must start with "Bearer "',
    };
  }

  // Extract token (everything after "Bearer ")
  const token = trimmedHeader.substring(bearerPrefix.length).trim();

  // Check for empty token
  if (!token) {
    return {
      success: false,
      error: 'empty_token',
      message: 'Token cannot be empty',
    };
  }

  return {
    success: true,
    token,
  };
}

/**
 * Extract token and log failures for security monitoring
 * 
 * @param request - The incoming request
 * @param endpoint - Endpoint name for logging context
 * @returns Token string if valid, null if invalid
 */
export function extractAndValidateToken(
  request: NextRequest,
  endpoint: string
): string | null {
  const result = extractBearerToken(request);
  
  if (!result.success) {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    logger.warn(`Token extraction failed at ${endpoint}`, {
      endpoint,
      error: result.error,
      ip: clientIp,
      userAgent: request.headers.get('user-agent'),
      // Don't log the header itself - security risk
    });
    
    return null;
  }
  
  return result.token;
}
