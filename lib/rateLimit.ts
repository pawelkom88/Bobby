// /lib/rateLimit.ts

/**
 * Distributed Rate Limiter with Upstash Redis fallback to in-memory
 *
 * Security improvements:
 * - CWE-770: Proper resource allocation limits
 * - CWE-290: Improved IP extraction to reduce spoofing
 * - CWE-400: Memory limits to prevent DoS
 * - Distributed rate limiting for serverless environments
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { isUpstashConfigured } from './env';
import { logger } from '@/lib/logger';

// ============================================
// Types
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

interface IRateLimiter {
  isRateLimited(identifier: string): Promise<RateLimitResult>;
  destroy?: () => void;
}

// ============================================
// In-Memory Rate Limiter (Fallback)
// ============================================

class InMemoryRateLimiter implements IRateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly maxEntries: number;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    cleanupMs: number = 60 * 1000, // Clean up every minute
    maxEntries: number = 10000 // Max entries to prevent memory bloat
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.maxEntries = maxEntries;

    // Only set up cleanup in non-edge environments
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, cleanupMs);

      // Prevent interval from keeping process alive
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  async isRateLimited(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();

    // CWE-770: Prevent unbounded memory growth
    if (this.limits.size >= this.maxEntries) {
      this.cleanup();

      // If still at max after cleanup, apply defensive rate limiting
      if (this.limits.size >= this.maxEntries) {
        logger.warn(
          'Rate limiter at max capacity, applying defensive limiting'
        );
        return {
          limited: true,
          remaining: 0,
          resetTime: now + this.windowMs,
        };
      }
    }

    const entry = this.limits.get(identifier);

    // First request or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        limited: false,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return {
        limited: true,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    return {
      limited: false,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleaned} expired entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
    logger.debug('In-memory rate limiter destroyed');
  }
}

// ============================================
// Upstash Redis Rate Limiter (Production)
// ============================================

class UpstashRateLimiter implements IRateLimiter {
  private ratelimit: Ratelimit;

  constructor(
    maxRequests: number = 100,
    windowMs: number = 15 * 60 * 1000,
    prefix: string = 'ratelimit'
  ) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Convert windowMs to appropriate format
    const windowSeconds = Math.ceil(windowMs / 1000);

    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: true,
      prefix: `app_${prefix}`,
    });
  }

  async isRateLimited(identifier: string): Promise<RateLimitResult> {
    try {
      const result = await this.ratelimit.limit(identifier);
      return {
        limited: !result.success,
        remaining: result.remaining,
        resetTime: result.reset,
      };
    } catch (error) {
      logger.error('Upstash rate limit error, failing open', { error });
      // Fail open to prevent blocking legitimate users
      // Consider failing closed in high-security scenarios
      return {
        limited: false,
        remaining: 1,
        resetTime: Date.now() + 60000,
      };
    }
  }

  destroy(): void {
    // Redis connections are managed by Upstash SDK
    logger.debug('Upstash rate limiter cleanup (no-op)');
  }
}

// ============================================
// IP Validation & Extraction
// ============================================

/**
 * Validate IP address format
 * Supports IPv4 and IPv6
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;

  // Trim and check length (max IPv6 with zone = ~45 chars)
  const trimmed = ip.trim();
  if (trimmed.length === 0 || trimmed.length > 45) return false;

  // IPv4 validation
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(trimmed)) {
    const octets = trimmed.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }

  // IPv6 validation (comprehensive)
  const ipv6Patterns = [
    // Full IPv6
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    // Compressed IPv6
    /^([0-9a-fA-F]{1,4}:){1,7}:$/,
    /^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/,
    /^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$/,
    /^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$/,
    /^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$/,
    /^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$/,
    /^[0-9a-fA-F]{1,4}:(:[0-9a-fA-F]{1,4}){1,6}$/,
    /^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/,
    // Loopback
    /^::1$/,
    /^::$/,
  ];

  return ipv6Patterns.some(pattern => pattern.test(trimmed));
}

/**
 * Sanitize IP address to prevent injection
 */
function sanitizeIP(ip: string): string {
  // Remove any non-IP characters
  return ip.replace(/[^0-9a-fA-F.:]/g, '').slice(0, 45);
}

/**
 * Extract client IP from request with improved security
 *
 * Security: CWE-290 - Reduces IP spoofing risk by:
 * 1. Validating IP format
 * 2. Using platform-specific headers when available
 * 3. Sanitizing input
 */
export function getClientIP(request: Request): string {
  // Platform-specific headers (most reliable)
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    const ip = vercelIP.split(',')[0].trim();
    if (isValidIP(ip)) return sanitizeIP(ip);
  }

  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP && isValidIP(cfIP)) {
    return sanitizeIP(cfIP);
  }

  // Standard headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    // First IP is typically the client
    const clientIp = ips[0];
    if (isValidIP(clientIp)) {
      return sanitizeIP(clientIp);
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && isValidIP(realIP)) {
    return sanitizeIP(realIP);
  }

  const clientIP = request.headers.get('x-client-ip');
  if (clientIP && isValidIP(clientIP)) {
    return sanitizeIP(clientIP);
  }

  // Fallback for development
  return '127.0.0.1';
}

// ============================================
// Rate Limiter Factory
// ============================================

// Cache for rate limiter instances
const limiterCache = new Map<string, IRateLimiter>();

/**
 * Create a rate limiter with custom settings
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number,
  prefix: string = 'default'
): IRateLimiter {
  const cacheKey = `${prefix}:${maxRequests}:${windowMs}`;

  // Return cached instance if exists
  if (limiterCache.has(cacheKey)) {
    return limiterCache.get(cacheKey)!;
  }

  let limiter: IRateLimiter;

  if (isUpstashConfigured()) {
    logger.debug(`Creating Upstash rate limiter: ${prefix}`);
    limiter = new UpstashRateLimiter(maxRequests, windowMs, prefix);
  } else {
    logger.debug(`Creating in-memory rate limiter: ${prefix}`);
    limiter = new InMemoryRateLimiter(maxRequests, windowMs);
  }

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

// Default rate limiter (general API)
let defaultLimiter: IRateLimiter | null = null;

function getDefaultLimiter(): IRateLimiter {
  if (!defaultLimiter) {
    defaultLimiter = createRateLimiter(100, 15 * 60 * 1000, 'default');

    if (isUpstashConfigured()) {
      logger.info('🔒 Using Upstash Redis for distributed rate limiting');
    } else {
      logger.warn(
        '⚠️ Using in-memory rate limiting (not suitable for production)'
      );
    }
  }
  return defaultLimiter;
}

// Pre-configured limiters for specific use cases
export const rateLimiters = {
  // Welcome email: 1 per hour per user
  welcomeEmail: createRateLimiter(1, 60 * 60 * 1000, 'welcome_email'),

  // Auth endpoints: 5 per minute per IP
  auth: createRateLimiter(5, 60 * 1000, 'auth'),

  // General API: 100 per 15 minutes
  api: createRateLimiter(100, 15 * 60 * 1000, 'api'),

  // Strict: 10 per minute (for sensitive operations)
  strict: createRateLimiter(10, 60 * 1000, 'strict'),
};

// ============================================
// Main Rate Limit Function
// ============================================

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param identifier - Optional custom identifier (e.g., userId for authenticated requests)
 * @param limiter - Optional specific rate limiter to use
 * @returns Rate limit status
 */
export async function checkRateLimit(
  request: Request,
  identifier?: string,
  limiter?: IRateLimiter
): Promise<RateLimitResult> {
  const activeLimiter = limiter || getDefaultLimiter();

  // Use custom identifier or fall back to IP
  const id = identifier || getClientIP(request);

  return activeLimiter.isRateLimited(id);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    ...(result.limited && {
      'Retry-After': Math.max(1, retryAfter).toString(),
    }),
  };
}

/**
 * Cleanup all rate limiters (for testing/shutdown)
 */
export function destroyAllLimiters(): void {
  for (const [key, limiter] of limiterCache.entries()) {
    if (limiter.destroy) {
      limiter.destroy();
    }
    limiterCache.delete(key);
  }

  if (defaultLimiter?.destroy) {
    defaultLimiter.destroy();
  }
  defaultLimiter = null;

  logger.info('All rate limiters destroyed');
}

// ============================================
// Legacy Export (Backward Compatibility)
// ============================================

export const rateLimiter = {
  async isRateLimited(identifier: string): Promise<boolean> {
    const result = await checkRateLimit(
      new Request('http://localhost'),
      identifier
    );
    return result.limited;
  },

  async getRemainingRequests(identifier: string): Promise<number> {
    const result = await checkRateLimit(
      new Request('http://localhost'),
      identifier
    );
    return result.remaining;
  },

  async getResetTime(identifier: string): Promise<number> {
    const result = await checkRateLimit(
      new Request('http://localhost'),
      identifier
    );
    return result.resetTime;
  },
};

// ============================================
// Export Types
// ============================================

export type { RateLimitResult, IRateLimiter };
