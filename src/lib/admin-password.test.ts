import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashAdminPassword, parseScryptHash, verifyAdminPassword } from "./admin-password";

const PASSWORD = "test-only password é";

describe("verifyAdminPassword", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("accepts_correct_salted_scrypt_password", async () => {
    vi.stubEnv("ADMIN_PASSWORD_SCRYPT", await hashAdminPassword(PASSWORD));
    await expect(verifyAdminPassword(PASSWORD)).resolves.toBe(true);
  });

  it("rejects_wrong_password", async () => {
    vi.stubEnv("ADMIN_PASSWORD_SCRYPT", await hashAdminPassword(PASSWORD));
    await expect(verifyAdminPassword("wrong")).resolves.toBe(false);
    await expect(verifyAdminPassword(`${PASSWORD} `)).resolves.toBe(false);
    await expect(verifyAdminPassword("")).resolves.toBe(false);
  });

  it("missing_or_malformed_hash_fails_closed", async () => {
    const valid = await hashAdminPassword(PASSWORD);
    const [, salt, key] = valid.split("$");
    const malformed = [
      undefined,
      "",
      PASSWORD,
      `scrypt$${salt}`,
      `scrypt$${salt}$${key}$extra`,
      `bcrypt$${salt}$${key}`,
      `scrypt$${salt.slice(2)}$${key}`,
      `scrypt$${salt}$${key.slice(2)}`,
      `scrypt$${salt}$${"z".repeat(128)}`,
      ` ${valid}`,
    ];
    for (const value of malformed) {
      if (value === undefined) vi.stubEnv("ADMIN_PASSWORD_SCRYPT", undefined);
      else vi.stubEnv("ADMIN_PASSWORD_SCRYPT", value);
      await expect(verifyAdminPassword(PASSWORD)).resolves.toBe(false);
    }
  });

  it("does_not_fall_back_to_ADMIN_PASSWORD", async () => {
    vi.stubEnv("ADMIN_PASSWORD_SCRYPT", undefined);
    vi.stubEnv("ADMIN_PASSWORD", PASSWORD);
    await expect(verifyAdminPassword(PASSWORD)).resolves.toBe(false);
  });

  it("different_salts_produce_different_hashes", async () => {
    const first = await hashAdminPassword(PASSWORD);
    const second = await hashAdminPassword(PASSWORD);
    expect(first).not.toBe(second);
    expect(parseScryptHash(first)).not.toBeNull();
    expect(parseScryptHash(second)).not.toBeNull();
  });

  it("uses_documented_format_and_parameters", async () => {
    const salt = Buffer.alloc(16, 1);
    const hash = await hashAdminPassword(PASSWORD, salt);
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    const { scryptSync } = await import("node:crypto");
    const expected = scryptSync(PASSWORD, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
    expect(hash).toBe(`scrypt$${salt.toString("hex")}$${expected}`);
  });
});
