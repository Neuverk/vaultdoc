type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): {
  success: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const current = store.get(key)

  if (!current || now > current.resetAt) {
    const resetAt = now + windowMs
    store.set(key, {
      count: 1,
      resetAt,
    })

    return {
      success: true,
      remaining: limit - 1,
      resetAt,
    }
  }

  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  store.set(key, current)

  return {
    success: true,
    remaining: limit - current.count,
    resetAt: current.resetAt,
  }
}