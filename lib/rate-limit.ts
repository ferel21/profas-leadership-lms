type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type Bucket = {
  count: number;
  resetTime: number;
};

export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  // Cleanup interval to prevent memory leaks in long-running processes
  if (typeof setInterval !== "undefined") {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of buckets.entries()) {
        if (now >= bucket.resetTime) {
          buckets.delete(key);
        }
      }
    }, options.windowMs);
    if (interval.unref) interval.unref();
  }

  function getClientIp(request: { headers: Headers } | Request): string {
    const headers = "headers" in request ? request.headers : new Headers();
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0].trim();
      if (firstIp) return firstIp;
    }
    const realIp = headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    return "127.0.0.1";
  }

  function check(request: { headers: Headers } | Request, customId?: string): RateLimitResult {
    const now = Date.now();
    const ip = getClientIp(request);
    const key = customId ? `${ip}:${customId}` : ip;

    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetTime) {
      bucket = {
        count: 0,
        resetTime: now + options.windowMs,
      };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, options.limit - bucket.count);
    const success = bucket.count <= options.limit;

    return {
      success,
      limit: options.limit,
      remaining,
      reset: bucket.resetTime,
    };
  }

  return { check };
}
