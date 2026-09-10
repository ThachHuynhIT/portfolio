import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

// Returns a plain ArrayBuffer (rather than a Uint8Array) so the result is
// always assignable to crypto.subtle.verify's BufferSource parameter —
// Uint8Array's generic buffer-type parameter (added in newer TypeScript/lib
// versions) otherwise defaults to the wider ArrayBufferLike, which newer
// BufferSource definitions reject.
function hexToBytes(hex: string): ArrayBuffer | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const buffer = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    view[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return buffer;
}

/**
 * Verify the `<expiresAt>.<hmac>` session token created by createSession()
 * in src/lib/admin-auth.ts. Reimplemented here (rather than imported) using
 * Web Crypto instead of Node's `crypto` module, since middleware runs in the
 * Edge runtime. crypto.subtle.verify performs the HMAC comparison in
 * constant time, same protection as Node's crypto.timingSafeEqual.
 */
async function isValidSessionToken(
  token: string | undefined,
  secret: string | undefined
): Promise<boolean> {
  if (!token || !secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const signatureBytes = hexToBytes(signature);
  if (!signatureBytes) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
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
