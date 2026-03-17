const hitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter. Returns true if the request should be allowed.
 * Resets after windowMs. Not persistent across serverless cold starts (by design —
 * this is a soft limit, not a security boundary).
 */
export function rateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = hitMap.get(key);

  if (!entry || now > entry.resetAt) {
    hitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return false;
  }

  return true;
}
