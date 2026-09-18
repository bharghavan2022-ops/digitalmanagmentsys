/**
 * In-memory fixed-window rate limiter for public, unauthenticated routes.
 * This only holds per-instance, not per-deployment: on serverless platforms
 * with multiple warm instances it under-counts rather than over-blocks,
 * which is the safe direction for a rate limit. Good enough until traffic
 * justifies Redis (see PROJECT_CONTEXT.md §3.2's Advanced Track) - swap
 * this module out then, the call site (`checkRateLimit`) doesn't need to
 * change.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIpFrom(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
