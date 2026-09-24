import type { NextRequest } from "next/server"

// Next.js doesn't expose the client IP directly on NextRequest — it depends
// on whatever reverse proxy sits in front of the app (Vercel, etc.) setting
// this header. Locally, with no proxy, it's simply absent.
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return "unknown"
}
