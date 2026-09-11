import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/session-token";

const SESSION_COOKIE = "admin_session";

/**
 * Verify the `<expiresAt>.<hmac>` session token created by createSession()
 * in src/lib/admin-auth.ts. Signature verification itself lives in
 * session-token.ts (Web Crypto), shared with admin-auth.ts — only the
 * expiry check is duplicated here since it's trivial and this function's
 * own concern.
 */
async function isValidSessionToken(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;

  const payload = await verifyToken(token, secret);
  if (!payload) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() <= expiresAt;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const isValidSession = await isValidSessionToken(
    sessionToken,
    process.env.AUTH_SECRET
  );

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!isValidSession) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and visiting /admin/login, redirect to /admin
  if (pathname === "/admin/login" && isValidSession) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
