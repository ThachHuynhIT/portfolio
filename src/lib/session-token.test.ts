import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/lib/session-token";

const SECRET = "test-secret-not-real";

describe("session-token", () => {
  it("round_trips_payload", async () => {
    const token = await signToken("1700000000000", SECRET);
    expect(token).toMatch(/^1700000000000\.[0-9a-f]{64}$/);
    expect(await verifyToken(token, SECRET)).toBe("1700000000000");
  });

  it("rejects_wrong_secret_tamper_bad_hex_extra_segments", async () => {
    const token = await signToken("1700000000000", SECRET);
    const [payload, signature] = token.split(".");

    expect(await verifyToken(token, "another-secret")).toBeNull();
    expect(await verifyToken(`1800000000000.${signature}`, SECRET)).toBeNull();
    const flipped = (signature[0] === "a" ? "b" : "a") + signature.slice(1);
    expect(await verifyToken(`${payload}.${flipped}`, SECRET)).toBeNull();
    expect(await verifyToken(`${payload}.zz${signature.slice(2)}`, SECRET)).toBeNull();
    expect(await verifyToken(`${payload}.${signature.slice(1)}`, SECRET)).toBeNull();
    expect(await verifyToken(`${payload}.`, SECRET)).toBeNull();
    expect(await verifyToken(`.${signature}`, SECRET)).toBeNull();
    expect(await verifyToken(payload, SECRET)).toBeNull();
    expect(await verifyToken("", SECRET)).toBeNull();
    // A valid token with trailing segments must not verify.
    expect(await verifyToken(`${token}.extra`, SECRET)).toBeNull();
    expect(await verifyToken(`${token}.`, SECRET)).toBeNull();
  });

  it("does_not_validate_expiry_itself", async () => {
    // Callers (admin-auth.ts, middleware.ts) check the expiry encoded in the payload.
    const expired = String(Date.now() - 60_000);
    const token = await signToken(expired, SECRET);
    expect(await verifyToken(token, SECRET)).toBe(expired);
  });
});
