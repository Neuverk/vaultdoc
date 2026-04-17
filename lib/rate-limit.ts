import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Environment check ────────────────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  if (IS_PRODUCTION) {
    console.error(
      '[rate-limit] FATAL: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. ' +
        'Rate limiting is non-functional in production. ' +
        'Set these environment variables in Vercel → Settings → Environment Variables.'
    )
  } else {
    console.warn(
      '[rate-limit] WARNING: Upstash env vars not set. ' +
        'Rate limiting is DISABLED in development. All requests will be allowed.'
    )
  }
}

// ─── Redis client (lazy — only created if env vars exist) ────────────────────

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null
  if (!redis) {
    redis = new Redis({
      url: UPSTASH_URL,
      token: UPSTASH_TOKEN,
    })
  }
  return redis
}

// ─── Rate limiter cache ───────────────────────────────────────────────────────
// We cache Ratelimit instances by window size to avoid recreating them on every request.

const limiterCache = new Map<number, Ratelimit>()

function getLimiter(limit: number, windowSeconds: number): Ratelimit | null {
  const client = getRedis()
  if (!client) return null

  const cacheKey = limit * 1_000_000 + windowSeconds

  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(
      cacheKey,
      new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: false,
        prefix: 'vaultdoc_rl',
      })
    )
  }

  return limiterCache.get(cacheKey)!
}

// ─── Result type ─────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number // Unix timestamp in milliseconds
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * checkRateLimit
 *
 * @param key       - Unique identifier for the rate limit bucket (e.g. userId or IP)
 * @param limit     - Max number of requests allowed in the window
 * @param windowMs  - Window duration in milliseconds
 *
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000)
  const limiter = getLimiter(limit, windowSeconds)

  // ── No Redis configured ───────────────────────────────────────────────────
  if (!limiter) {
    if (IS_PRODUCTION) {
      // In production with missing env vars: block all requests to fail safely
      console.error(
        `[rate-limit] Redis not configured. Blocking request for key: ${key}`
      )
      return {
        success: false,
        remaining: 0,
        resetAt: Date.now() + windowMs,
      }
    } else {
      // In development: allow all requests, just log a warning
      return {
        success: true,
        remaining: limit,
        resetAt: Date.now() + windowMs,
      }
    }
  }

  // ── Redis configured — perform real rate limit check ──────────────────────
  try {
    const result = await limiter.limit(key)

    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: result.reset, // Upstash returns Unix timestamp in milliseconds
    }
  } catch (error) {
    // If Redis call fails (network error, timeout), log and fail open in dev,
    // fail closed in production to avoid hiding infrastructure issues.
    console.error('[rate-limit] Redis call failed:', error)

    if (IS_PRODUCTION) {
      return {
        success: false,
        remaining: 0,
        resetAt: Date.now() + windowMs,
      }
    } else {
      return {
        success: true,
        remaining: limit,
        resetAt: Date.now() + windowMs,
      }
    }
  }
}