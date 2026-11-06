import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { createRateLimiter as CreateRateLimiter } from "./rate-limit";

type Limiter = ReturnType<typeof CreateRateLimiter>;

const mocks = vi.hoisted(() => ({
  verifyAdminPassword: vi.fn<(password: string) => Promise<boolean>>(),
  createSession: vi.fn<() => Promise<void>>(),
  limiters: [] as Limiter[],
  cookieSet: vi.fn(),
}));

vi.mock("@/lib/admin-password", () => ({
  verifyAdminPassword: mocks.verifyAdminPassword,
}));

vi.mock("@/lib/admin-auth", () => ({
  createSession: mocks.createSession,
  destroySession: vi.fn(),
  verifySession: vi.fn(),
}));

// Wrap the real limiter so the route keeps its real 5-per-15-minutes
// behaviour while the test can still observe recordAttempt/clearAttempts.
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./rate-limit")>();
  return {
    ...actual,
    createRateLimiter: (options: Parameters<typeof CreateRateLimiter>[0]) => {
      const limiter = actual.createRateLimiter(options);
      vi.spyOn(limiter, "recordAttempt");
      vi.spyOn(limiter, "clearAttempts");
      mocks.limiters.push(limiter);
      return limiter;
    },
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: mocks.cookieSet, get: vi.fn(), delete: vi.fn() }),
}));

async function loadRoute() {
  vi.resetModules();
  mocks.limiters.length = 0;
  const route = await import("@/app/api/admin/auth/route");
  return { POST: route.POST, limiter: () => mocks.limiters[0] };
}

function loginRequest(body: unknown, ip = "203.0.113.7"): Request {
  return new Request("http://localhost/api/admin/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/admin/auth", () => {
  beforeEach(() => {
    mocks.verifyAdminPassword.mockReset();
    mocks.createSession.mockReset().mockResolvedValue(undefined);
  });

  it("wrong_password_returns_401_and_records_attempt", async () => {
    mocks.verifyAdminPassword.mockResolvedValue(false);
    const { POST, limiter } = await loadRoute();
    const res = await POST(loginRequest({ password: "wrong" }));
    expect(res.status).toBe(401);
    expect(mocks.verifyAdminPassword).toHaveBeenCalledWith("wrong");
    expect(limiter().recordAttempt).toHaveBeenCalledWith("203.0.113.7");
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("correct_password_clears_attempts_and_creates_session", async () => {
    mocks.verifyAdminPassword.mockResolvedValue(true);
    const { POST, limiter } = await loadRoute();
    const res = await POST(loginRequest({ password: "right" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(limiter().clearAttempts).toHaveBeenCalledWith("203.0.113.7");
    expect(limiter().recordAttempt).not.toHaveBeenCalled();
    expect(mocks.createSession).toHaveBeenCalledTimes(1);
  });

  it("five_wrong_attempts_in_window_then_429", async () => {
    mocks.verifyAdminPassword.mockResolvedValue(false);
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) {
      expect((await POST(loginRequest({ password: `wrong-${i}` }))).status).toBe(401);
    }
    mocks.verifyAdminPassword.mockResolvedValue(true);
    const blocked = await POST(loginRequest({ password: "right" }));
    expect(blocked.status).toBe(429);
    expect(mocks.verifyAdminPassword).toHaveBeenCalledTimes(5);
    expect(mocks.createSession).not.toHaveBeenCalled();
    // Other clients are unaffected.
    expect((await POST(loginRequest({ password: "right" }, "198.51.100.2"))).status).toBe(200);
  });

  it("rejects_old_passwordHash_payload_with_400", async () => {
    const { POST } = await loadRoute();
    const hash = "a".repeat(64);
    for (const body of [{ passwordHash: hash }, { password: "right", passwordHash: hash }]) {
      const res = await POST(loginRequest(body));
      expect(res.status).toBe(400);
    }
    expect(mocks.verifyAdminPassword).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects_blank_non_string_or_invalid_json_with_400", async () => {
    const { POST } = await loadRoute();
    for (const body of [{ password: "" }, { password: 42 }, {}, "not json"]) {
      expect((await POST(loginRequest(body))).status).toBe(400);
    }
    expect(mocks.verifyAdminPassword).not.toHaveBeenCalled();
  });
});

describe("createSession", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps_existing_hmac_cookie_and_flags", async () => {
    vi.stubEnv("AUTH_SECRET", "test-only-secret");
    vi.stubEnv("NODE_ENV", "production");
    mocks.cookieSet.mockReset();
    const actual = await vi.importActual<typeof import("./admin-auth")>("./admin-auth");
    await actual.createSession();

    expect(mocks.cookieSet).toHaveBeenCalledTimes(1);
    const [name, token, options] = mocks.cookieSet.mock.calls[0];
    expect(name).toBe("admin_session");
    expect(token).toMatch(/^\d+\.[0-9a-f]{64}$/);
    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  });

  it("no_longer_exports_client_hash_verifier", async () => {
    const actual = await vi.importActual<Record<string, unknown>>("./admin-auth");
    expect(actual.verifyPasswordHash).toBeUndefined();
  });
});
