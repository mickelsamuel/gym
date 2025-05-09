/**
 * Rate Limiter Utility
 * Prevents excessive API calls by tracking request frequency
 */
interface RateLimit {
  count: number;
  resetTime: number;
}
interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  identifier?: string;
}
/**
 * Simple in-memory rate limiter to prevent API abuse
 */
class RateLimiter {
  private limits: Map<string, RateLimit>;
  private defaultOptions: RateLimiterOptions;
  constructor() {
    this.limits = new Map();
    this.defaultOptions = {
      windowMs: 60000, // 1 minute window
      maxRequests: 60, // 60 requests per minute
    };
    // Clean up expired rate limits every minute
    setInterval(() => this.cleanupExpiredLimits(), 60000);
  }
  /**
   * Check if a request is allowed based on rate limits
   * @param options Rate limiter options
   * @returns Whether the request is allowed
   */
  public isAllowed(options?: Partial<RateLimiterOptions>): boolean {
    const config = { ...this.defaultOptions, ...options };
    const identifier = config.identifier || 'default';
    const now = Date.now();
    // Get or create rate limit entry
    let limit = this.limits.get(identifier);
    if (!limit || now > limit.resetTime) {
      // Create new rate limit if expired or doesn't exist
      limit = {
        count: 0,
        resetTime: now + config.windowMs
      };
      this.limits.set(identifier, limit);
    }
    // Check if under limit
    if (limit.count < config.maxRequests) {
      limit.count++;
      return true;
    }
    return false;
  }
  /**
   * Clean up expired rate limits to prevent memory leaks
   */
  private cleanupExpiredLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }
  /**
   * Reset rate limit for a specific identifier
   * @param identifier The rate limit identifier to reset
   */
  public reset(identifier: string): void {
    this.limits.delete(identifier);
  }
  /**
   * Reset all rate limits
   */
  public resetAll(): void {
    this.limits.clear();
  }
}
// Export singleton instance
export const rateLimiter = new RateLimiter();
// Helper function to use rate limiter with Firebase user ID
export const isRequestAllowed = (
  userId: string,
  operationType: 'read' | 'write' | 'auth',
  customOptions?: Partial<RateLimiterOptions>
): boolean => {
  const identifier = `${userId}:${operationType}`;
  // Different limits for different operation types
  const options: Partial<RateLimiterOptions> = {
    identifier,
    ...customOptions
  };
  // Custom limits based on operation type
  switch (operationType) {
    case 'write':
      options.maxRequests = 30; // Stricter limit for writes
      break;
    case 'auth':
      options.maxRequests = 5; // Very strict for auth operations
      options.windowMs = 60000; // 1 minute window for auth
      break;
    case 'read':
    default:
      options.maxRequests = 100; // More generous for reads
      break;
  }
  return rateLimiter.isAllowed(options);
};
/**
 * Rate limit error for consistent handling
 */
export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message);
    this.name = 'RateLimitError';
  }
} 