import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000; // 60-second sliding window
const MAX_REQUESTS = 10;

/** Map of IP -> array of request timestamps within the current window */
const requestLog = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be comma-separated; first entry is the real client
    return forwarded.split(",")[0].trim();
  }
  // On Vercel, x-forwarded-for is always set. Fallback covers local dev.
  return "unknown";
}

export function middleware(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get existing timestamps and filter to current window
  const timestamps = (requestLog.get(ip) ?? []).filter(
    (t) => t > windowStart
  );

  const remaining = Math.max(0, MAX_REQUESTS - timestamps.length);

  if (timestamps.length >= MAX_REQUESTS) {
    // Oldest timestamp in the window determines when the next slot opens
    const oldestInWindow = timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);

    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Record this request
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set("X-RateLimit-Remaining", String(remaining - 1));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
