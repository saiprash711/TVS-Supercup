/**
 * Security Middleware — Rate Limiting, Request Validation, Audit Logging
 *
 * Implements server-side protections required before production handover:
 *   1. IP-based rate limiting for authentication endpoints
 *   2. Request size and content-type validation
 *   3. API request audit trail for compliance
 *   4. Input sanitization helpers
 */

// ─── Rate Limiter (In-Memory, Edge-Compatible) ─────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leak (every 5 minutes)
let lastCleanup = Date.now();
function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique key prefix (e.g., 'login', 'admin') */
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Check and update rate limit for a given IP + endpoint combination.
 * Returns whether the request is allowed and headers to set.
 */
export function checkRateLimit(
  clientIp: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpired();

  const key = `${config.keyPrefix}:${clientIp}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // First request in this window
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  };
}

// Pre-configured rate limit profiles
export const RATE_LIMITS = {
  dealerLogin: (): RateLimitConfig => ({
    maxRequests: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000', 10),
    keyPrefix: 'dealer-login',
  }),
  adminLogin: (): RateLimitConfig => ({
    maxRequests: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '3', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || '900000', 10),
    keyPrefix: 'admin-login',
  }),
  apiGeneral: (): RateLimitConfig => ({
    maxRequests: 100,
    windowMs: 60_000, // 100 requests per minute
    keyPrefix: 'api-general',
  }),
} as const;

// ─── Client IP Extraction ──────────────────────────────────────────────────

/**
 * Extract the real client IP from the request, respecting proxy headers.
 * Prioritizes: X-Real-IP > X-Forwarded-For (first entry) > fallback
 */
export function getClientIp(request: Request): string {
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Vercel-specific header
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0]?.trim() || 'unknown';

  return 'unknown';
}

// ─── Input Sanitization ────────────────────────────────────────────────────

/**
 * Sanitize string input to prevent injection attacks.
 * Strips control characters and limits length.
 */
export function sanitizeInput(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  // Remove null bytes and control characters (keep newlines/tabs for legitimate use)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, maxLength).trim();
}

/**
 * Validate and sanitize a dealer identifier (ID, phone, username).
 * Prevents SQL injection and XSS in authentication flows.
 */
export function sanitizeDealerIdentifier(identifier: string): string {
  const cleaned = sanitizeInput(identifier, 100);
  // Allow alphanumeric, hyphens, underscores, dots, spaces, and + for phone
  return cleaned.replace(/[^a-zA-Z0-9\s\-_.+@]/g, '');
}

// ─── Request Validation ────────────────────────────────────────────────────

/**
 * Validate content-type for JSON endpoints.
 */
export function validateJsonContentType(request: Request): boolean {
  const contentType = request.headers.get('content-type');
  return Boolean(contentType && contentType.includes('application/json'));
}

/**
 * Validate that the request body is within acceptable size limits.
 * Returns true if content-length is within limit.
 */
export function validateRequestSize(request: Request, maxBytes = 1_048_576): boolean {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return true; // Let the framework handle if missing
  return parseInt(contentLength, 10) <= maxBytes;
}

// ─── Audit Trail ───────────────────────────────────────────────────────────

export interface AuditEntry {
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  userAgent: string;
  /** 'dealer' | 'admin' | 'internal' | 'public' */
  authContext: string;
  /** HTTP status code */
  status?: number;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Additional context */
  details?: string;
}

/**
 * Create an audit log entry from a request.
 * In production, these should be sent to a structured logging system.
 */
export function createAuditEntry(
  request: Request,
  authContext: string,
  details?: string
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    ip: getClientIp(request),
    method: request.method,
    path: new URL(request.url).pathname,
    userAgent: request.headers.get('user-agent')?.slice(0, 200) || 'unknown',
    authContext,
    details,
  };
}

/**
 * Log an audit entry. In production with GCP, this should write to
 * Cloud Logging / structured JSON logs for SIEM integration.
 */
export function logAudit(entry: AuditEntry): void {
  if (process.env.AUDIT_ALL_REQUESTS === 'true' || process.env.NODE_ENV === 'production') {
    // Structured JSON log line for Cloud Logging / log aggregators
    console.log(JSON.stringify({
      severity: 'INFO',
      component: 'supercup-audit',
      ...entry,
    }));
  }
}

// ─── Security Headers Helper ───────────────────────────────────────────────

/**
 * Return security headers to apply to API responses.
 */
export function getSecurityResponseHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0', // Modern browsers: rely on CSP instead
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };
}

/**
 * Apply security headers to a NextResponse.
 */
export function applySecurityHeaders(response: Response): void {
  const headers = getSecurityResponseHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
}
