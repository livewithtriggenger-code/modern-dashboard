import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 20 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
});

export async function proxy(request: NextRequest) {
  // 1. Rate Limiting Protection (API routes only)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip ?? "127.0.0.1";
    
    // In local dev without env variables, we skip ratelimiting to avoid crashing
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(`ratelimit_${ip}`);
      if (!success) {
        return new NextResponse("Rate Limit Exceeded", { status: 429 });
      }
    }
  }

  // 2. Supabase Session Management
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
