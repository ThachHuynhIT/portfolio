import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import nextConfig from "../../next.config.js";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init";

type Header = { key: string; value: string };

async function getSiteWideHeaders(): Promise<Map<string, string>> {
  const { headers } = nextConfig;
  if (typeof headers !== "function") throw new Error("next.config.js must define headers()");
  const rules = (await headers()) as { source: string; headers: Header[] }[];
  const rule = rules.find((r) => r.source === "/:path*");
  expect(rule).toBeDefined();
  return new Map(rule!.headers.map((h) => [h.key.toLowerCase(), h.value]));
}

function directive(policy: string, name: string): string[] {
  const entry = policy
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.split(/\s+/)[0] === name);
  return entry ? entry.split(/\s+/).slice(1) : [];
}

describe("security headers (next.config.js)", () => {
  it("headers_deny_frames_and_nosniff", async () => {
    const headers = await getSiteWideHeaders();
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    // The enforcing CSP only carries frame-ancestors; everything else is report-only.
    expect(headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
  });

  it("hsts_only_production_https_policy", async () => {
    // Vercel already sends `Strict-Transport-Security: max-age=63072000;
    // includeSubDomains; preload` for the production domain (checked with
    // `curl.exe -sI https://portfolio-thach.vercel.app/`), so the app must not
    // emit a second, conflicting HSTS header.
    const headers = await getSiteWideHeaders();
    expect(headers.has("strict-transport-security")).toBe(false);
  });

  it("report_only_csp_has_baseline_directives", async () => {
    const policy = (await getSiteWideHeaders()).get("content-security-policy-report-only") ?? "";
    expect(directive(policy, "default-src")).toEqual(["'self'"]);
    expect(directive(policy, "object-src")).toEqual(["'none'"]);
    expect(directive(policy, "base-uri")).toEqual(["'self'"]);
    expect(directive(policy, "form-action")).toEqual(["'self'"]);
    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(policy).not.toContain("*");
    if (process.env.NODE_ENV === "production") {
      expect(policy).not.toContain("'unsafe-eval'");
    }
  });

  it("theme_hash_matches_emitted_script", async () => {
    const policy = (await getSiteWideHeaders()).get("content-security-policy-report-only") ?? "";
    const expected = `'sha256-${createHash("sha256").update(THEME_INIT_SCRIPT, "utf8").digest("base64")}'`;
    // If this fails after editing buildThemeInitScript(), copy `expected` into
    // THEME_INIT_SCRIPT_HASH in next.config.js.
    expect(directive(policy, "script-src")).toContain(expected);

    // The root layout must emit exactly that string (no inline copy that could drift).
    const layout = readFileSync(fileURLToPath(new URL("../app/layout.tsx", import.meta.url)), "utf8");
    expect(layout).toMatch(/import\s*\{[^}]*\bTHEME_INIT_SCRIPT\b[^}]*\}\s*from\s*"@\/lib\/theme-init"/);
    expect(layout).toContain("__html: THEME_INIT_SCRIPT");
    expect(layout).not.toMatch(/const\s+THEME_INIT_SCRIPT\s*=/);
  });
});
