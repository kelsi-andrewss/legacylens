import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const requestLog = new Map<string, number[]>();

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.ip ?? "unknown";
}

export function middleware(request: NextRequest): NextResponse {
  const ip = getIp(request);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const timestamps = (requestLog.get(ip) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  const remaining = Math.max(0, MAX_REQUESTS - timestamps.length);

  if (timestamps.length > MAX_REQUESTS) {
    const oldest = timestamps[timestamps.length - MAX_REQUESTS - 1];
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);

    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.max(1, retryAfter)),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
