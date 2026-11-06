import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, getClientIp } from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks_after_max", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: WINDOW_MS });
    for (let i = 0; i < 2; i++) limiter.recordAttempt("k");
    expect(limiter.isRateLimited("k")).toBe(false);
    limiter.recordAttempt("k");
    expect(limiter.isRateLimited("k")).toBe(true);
  });

  it("resets_after_window", () => {
    const limiter = createRateLimiter({ max: 2, windowMs: WINDOW_MS });
    limiter.recordAttempt("k");
    limiter.recordAttempt("k");
    // Current boundary: still limited at exactly resetAt (expiry is `now > resetAt`).
    vi.advanceTimersByTime(WINDOW_MS);
    expect(limiter.isRateLimited("k")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(limiter.isRateLimited("k")).toBe(false);
    // A new attempt after expiry starts a fresh window at count 1.
    limiter.recordAttempt("k");
    expect(limiter.isRateLimited("k")).toBe(false);
  });

  it("isolates_keys", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: WINDOW_MS });
    limiter.recordAttempt("a");
    expect(limiter.isRateLimited("a")).toBe(true);
    expect(limiter.isRateLimited("b")).toBe(false);

    const other = createRateLimiter({ max: 1, windowMs: WINDOW_MS });
    expect(other.isRateLimited("a")).toBe(false);
  });

  it("clear_restores", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: WINDOW_MS });
    limiter.recordAttempt("k");
    expect(limiter.isRateLimited("k")).toBe(true);
    limiter.clearAttempts("k");
    expect(limiter.isRateLimited("k")).toBe(false);
  });
});

describe("getClientIp", () => {
  it("uses_last_forwarded_ip_or_unknown", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientIp(new Headers({ "x-forwarded-for": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.1.1.1, , " }))).toBe("1.1.1.1");
    expect(getClientIp(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
