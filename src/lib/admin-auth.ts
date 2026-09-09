import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Hash a value using SHA-256 for simple session token generation.
 */
function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Get the admin password from environment variable.
 * Falls back to "admin123" in development for convenience.
 */
function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

/**
 * Verify that the provided password matches the admin password.
 */
export function verifyPassword(password: string): boolean {
  return password === getAdminPassword();
}

/**
 * Create a session token and set it as an HTTP-only cookie.
 */
export async function createSession(): Promise<string> {
  const token = sha256(`${getAdminPassword()}-${Date.now()}-${Math.random()}`);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  // Store the token hash so we can verify it later
  const tokenHash = sha256(token);
  store.set("admin_session_hash", tokenHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return token;
}

/**
 * Verify the current session is valid.
 * Returns true if a valid session cookie exists.
 */
export async function verifySession(): Promise<boolean> {
  const store = await cookies();
  const sessionToken = store.get(SESSION_COOKIE)?.value;
  const sessionHash = store.get("admin_session_hash")?.value;

  if (!sessionToken || !sessionHash) {
    return false;
  }

  // Verify the token matches its stored hash
  return sha256(sessionToken) === sessionHash;
}

/**
 * Destroy the current session by clearing cookies.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete("admin_session_hash");
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
