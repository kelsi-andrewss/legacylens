import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000;

const ROUTE_LIMITS: { prefix: string; limit: number; bucket: string }[] = [
  { prefix: "/api/query", limit: 10, bucket: "query" },
  { prefix: "/api/games/", limit: 60, bucket: "games" },
];
const DEFAULT_LIMIT = 10;
const DEFAULT_BUCKET = "default";

const requestLog = new Map<string, number[]>();

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

function getRouteConfig(pathname: string): { limit: number; bucket: string } {
  for (const route of ROUTE_LIMITS) {
    if (pathname.startsWith(route.prefix)) {
      return { limit: route.limit, bucket: route.bucket };
    }
  }
  return { limit: DEFAULT_LIMIT, bucket: DEFAULT_BUCKET };
}

export function middleware(request: NextRequest): NextResponse {
  const ip = getIp(request);
  const pathname = request.nextUrl.pathname;
  const { limit, bucket } = getRouteConfig(pathname);

  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  requestLog.set(key, timestamps);

  const remaining = Math.max(0, limit - timestamps.length);

  if (timestamps.length > limit) {
    const oldest = timestamps[timestamps.length - limit - 1];
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);

    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.max(1, retryAfter)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
