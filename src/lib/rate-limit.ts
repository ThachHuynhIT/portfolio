// Generic in-memory fixed-window rate limiter. Each `createRateLimiter()`
// call gets its own independent Map — callers (admin login, public contact
// form) never share counters even though they use the same primitive.
//
// Known limitation: state lives in process memory. On a single long-running
// process (local dev, self-host) this works as intended; on Vercel serverless
// each lambda instance has its own memory, so attempts spread across cold
// starts / instances are not counted together. Acceptable for this app's
// scale (single admin, low public traffic) — revisit with a shared store
// (e.g. Upstash Redis) if this ever needs to hold under real distributed
// traffic.
export function createRateLimiter({
  max,
  windowMs,
}: {
  max: number;
  windowMs: number;
}) {
  type AttemptRecord = { count: number; resetAt: number };
  const attempts = new Map<string, AttemptRecord>();

  // `key` is attacker-controlled (email, IP) — sweep expired entries on
  // write instead of letting the map grow unbounded with junk keys.
  function sweepExpired(): void {
    const now = Date.now();
    for (const [key, record] of attempts) {
      if (now > record.resetAt) attempts.delete(key);
    }
  }

  return {
    isRateLimited(key: string): boolean {
      const record = attempts.get(key);
      if (!record || Date.now() > record.resetAt) return false;
      return record.count >= max;
    },

    recordAttempt(key: string): void {
      sweepExpired();
      const record = attempts.get(key);
      if (!record || Date.now() > record.resetAt) {
        attempts.set(key, { count: 1, resetAt: Date.now() + windowMs });
        return;
      }
      record.count += 1;
    },

    clearAttempts(key: string): void {
      attempts.delete(key);
    },

    // Seconds until `key`'s current window resets (for a Retry-After
    // header); 0 when there is no active window. Read-only.
    getRetryAfterSeconds(key: string): number {
      const record = attempts.get(key);
      if (!record) return 0;
      const remainingMs = record.resetAt - Date.now();
      return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
    },
  };
}

// Vercel (and most reverse proxies) append the address they observed the
// connection from as the LAST entry of x-forwarded-for; every earlier entry
// is whatever the client itself claimed and is trivially spoofable by
// sending a fake header. Taking the first entry — as an earlier version of
// this function did — let an attacker rotate a fake IP on every request and
// bypass rate limiting entirely. Falls back to a shared bucket in
// environments without the header (e.g. local dev) rather than throwing.
export function getClientIp(headerList: Headers): string {
  const forwardedFor = headerList.get("x-forwarded-for");
  const ips = forwardedFor?.split(",").map((ip) => ip.trim()).filter(Boolean);
  return ips?.[ips.length - 1] || "unknown";
}

// CSRF-style guard for unauthenticated, state-changing public endpoints
// (e.g. recording a music play). Fetch Metadata is authoritative when the
// browser sends it: only `same-origin` passes. Otherwise an Origin header
// must match the request host. Requests with neither header (non-browser
// clients, which can forge both anyway) are allowed; the per-IP limiter
// is what bounds those.
export function isSameOriginRequest(headerList: Headers, requestUrl: string): boolean {
  const fetchSite = headerList.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "same-origin";

  const origin = headerList.get("origin");
  if (!origin) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const requestHost = headerList.get("host") ?? new URL(requestUrl).host;
  return originHost === requestHost;
}
