import { NextResponse } from "next/server";
import { createSession, destroySession, verifySession } from "@/lib/admin-auth";
import { verifyAdminPassword } from "@/lib/admin-password";
import { loginSchema } from "@/lib/login-schema";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const loginRateLimiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

/**
 * GET /api/admin/auth — Check current session status
 */
export async function GET() {
  try {
    const isValid = await verifySession();
    if (!isValid) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/auth — Login
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    if (loginRateLimiter.isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Strict parse: only `{ password }` is accepted; the legacy
    // `{ passwordHash }` payload and invalid JSON are rejected with 400.
    // Never log the body — it contains the plain password.
    const body: unknown = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!(await verifyAdminPassword(parsed.data.password))) {
      loginRateLimiter.recordAttempt(ip);
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    loginRateLimiter.clearAttempts(ip);

    await createSession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth — Logout
 */
export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

