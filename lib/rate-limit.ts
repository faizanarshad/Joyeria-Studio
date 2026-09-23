import { Redis } from "@upstash/redis";

// In-memory fixed-window limiter. Fine for a single long-running instance,
// but Vercel runs each request on one of several serverless instances with
// no shared memory, so this under-counts in production — two instances each
// think they're the first hit. Kept as the local-dev / no-Redis-configured
// fallback; pair with the honeypot field either way.
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

// Upstash's REST API works from any serverless runtime with no persistent
// connection, so it's the shared counter across instances that the in-memory
// map can't be. Optional: without these env vars set, every instance just
// falls back to counting on its own.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

async function isRateLimitedRedis(key: string, limit: number, windowMs: number): Promise<boolean> {
  const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / windowMs)}`;
  const count = await redis!.incr(windowKey);
  if (count === 1) {
    await redis!.pexpire(windowKey, windowMs);
  }
  return count > limit;
}

// Use this in route handlers — uses Redis when configured (correct across
// serverless instances), otherwise transparently falls back to the in-memory
// check. Fails open on a Redis error: a rate limiter that takes checkout down
// when Redis hiccups is worse than one that occasionally under-limits.
export async function checkRateLimit(key: string, limit = 5, windowMs = 60_000): Promise<boolean> {
  if (!redis) return isRateLimitedInMemory(key, limit, windowMs);
  try {
    return await isRateLimitedRedis(key, limit, windowMs);
  } catch (err) {
    console.error("Rate limit check failed, failing open", err);
    return false;
  }
}
