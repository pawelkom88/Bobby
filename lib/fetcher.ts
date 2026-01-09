import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Custom error classes for better error handling
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Type-safe fetcher with Zod validation
 * 
 * @param url - The URL to fetch
 * @param schema - Zod schema to validate the response
 * @param options - Fetch options
 * @returns Validated data
 */
export async function fetchWithValidation<T>(
  url: string,
  schema: z.ZodSchema<T>,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new NetworkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    const data = await response.json();
    
    try {
      return schema.parse(data);
    } catch (error) {
      logger.error('Validation error:', error);
      throw new ValidationError('Response validation failed', error);
    }
  } catch (error) {
    if (error instanceof NetworkError || error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Fetch error:', error);
    throw new NetworkError(
      'Network request failed',
      0,
      'Network Error'
    );
  }
}

/**
 * Fetcher for authenticated requests
 * 
 * @param url - The URL to fetch
 * @param schema - Zod schema to validate the response
 * @param getAuthToken - Function to get auth token
 * @param options - Fetch options
 * @returns Validated data
 */
export async function authenticatedFetch<T>(
  url: string,
  schema: z.ZodSchema<T>,
  getAuthToken: () => Promise<string | null>,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new NetworkError(
      'Authentication required',
      401,
      'Unauthorized'
    );
  }

  return fetchWithValidation(url, schema, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token,
    },
  });
}

/**
 * Helper to create API schema with common response structure
 */
export function createApiSchema<T>(dataSchema: z.ZodSchema<T>) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });
}

/**
 * Helper for mutation responses that don't return data
 */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
