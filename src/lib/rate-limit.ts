import { NextRequest, NextResponse } from "next/server";

// In-memory store: key = IP, value = { count, resetAt }
// This is per-instance — good enough for a single-server / serverless cold-start model.
// For multi-instance deploys, swap this for Redis (e.g. Upstash).
const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Returns a NextResponse with 429 if the request is rate-limited, otherwise null.
 * Call this at the top of every API route handler.
 */
export function rateLimit(
  req: NextRequest,
  { limit = 30, windowMs = 60_000 }: Partial<RateLimitOptions> = {}
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now >= entry.resetAt) {
    // New window
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
