// Simple in-memory rate limiter
// In production, consider using Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private cleanupMs: number = 60 * 1000 // Clean up every minute
  ) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupMs);
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return false;
    }

    if (entry.count >= this.maxRequests) {
      return true; // Rate limited
    }

    entry.count++;
    return false;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    return entry?.resetTime || 0;
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Helper function for API routes
export function checkRateLimit(request: Request, identifier?: string): {
  limited: boolean;
  remaining: number;
  resetTime: number;
} {
  // Use IP address or custom identifier
  const id = identifier || getClientIP(request);

  const limited = rateLimiter.isRateLimited(id);
  const remaining = rateLimiter.getRemainingRequests(id);
  const resetTime = rateLimiter.getResetTime(id);

  return { limited, remaining, resetTime };
}

// Extract client IP from request
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) return realIP;
  if (clientIP) return clientIP;

  // Fallback for development
  return '127.0.0.1';
}
