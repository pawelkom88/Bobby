/**
 * Retry utility for handling transient failures
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delayMs = config.delayMs * Math.pow(config.backoffMultiplier, attempt);
        config.onRetry?.(attempt + 1, lastError);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Retry with a fallback value
 */
export async function retryWithFallback<T>(
  fn: () => Promise<T>,
  fallbackValue: T,
  options?: RetryOptions
): Promise<T> {
  try {
    return await retry(fn, options);
  } catch (error) {
    console.error('Retry failed, using fallback:', error);
    return fallbackValue;
  }
}

