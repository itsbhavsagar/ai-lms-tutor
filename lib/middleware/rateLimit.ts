interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const CLEANUP_INTERVAL = 60000;

setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, CLEANUP_INTERVAL);

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimitMiddleware(req: Request): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : req.headers.get("x-forwarded-for") || "anonymous";

    const now = Date.now();
    let entry: { count: number; resetTime: number } | undefined = store[key];

    if (entry && entry.resetTime < now) {
      delete store[key];
      entry = undefined;
    }

    if (!entry) {
      entry = store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    const allowed = entry.count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  };
}

export const RATE_LIMITS = {
  api: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
  }),

  chat: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
  }),

  upload: createRateLimiter({
    windowMs: 10 * 60 * 1000,
    maxRequests: 10,
  }),

  strict: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
  }),
};

export function createRateLimitResponse(
  remaining: number,
  resetTime: number,
): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      remaining,
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(resetTime),
      },
    },
  );
}
