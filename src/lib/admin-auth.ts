import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { signToken, verifyToken } from "./session-token";

const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours, in seconds

/**
 * Get the admin password from environment variable. Throws rather than
 * silently falling back to a known default — an unset ADMIN_PASSWORD must
 * fail loudly, not leave the admin panel guarded by "admin123".
 */
function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set.");
  }
  return password;
}

/**
 * The secret used to sign session cookies. Reuses AUTH_SECRET (already
 * provisioned for this project) rather than introducing a second secret.
 */
function getSessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set.");
  }
  return secret;
}

function sha256(value: string): Buffer {
  return crypto.createHash("sha256").update(value).digest();
}

/**
 * Verify that the provided password matches the admin password.
 * Constant-time comparison of equal-length digests avoids leaking the
 * password length/prefix through response-timing differences.
 */
export function verifyPassword(password: string): boolean {
  const expected = sha256(getAdminPassword());
  const actual = sha256(password);
  return crypto.timingSafeEqual(actual, expected);
}

/**
 * Create a signed session token and set it as an HTTP-only cookie. The
 * cookie is `<expiresAt>.<hmac>` — expiresAt is a plain Unix timestamp,
 * hmac is HMAC-SHA256(AUTH_SECRET, expiresAt), so the token cannot be
 * forged or extended without knowing AUTH_SECRET. Signing/verifying is
 * shared with middleware.ts via session-token.ts (Web Crypto works in both
 * this Node runtime and middleware's Edge runtime, so there's no need for
 * two separate implementations).
 */
export async function createSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const token = await signToken(String(expiresAt), getSessionSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Verify the current session is valid: well-formed, signature matches, and
 * not expired.
 */
export async function verifySession(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = await verifyToken(token, getSessionSecret());
  if (!payload) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  return true;
}

/**
 * Destroy the current session by clearing its cookie.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Guard for admin API routes: returns a 401 NextResponse if there is no valid
 * session, or null if the caller is authorized. Usage:
 *
 *   const authError = await requireAdminSession();
 *   if (authError) return authError;
 */
export async function requireAdminSession(): Promise<NextResponse | null> {
  if (await verifySession()) {
    return null;
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
