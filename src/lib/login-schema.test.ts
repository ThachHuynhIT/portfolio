import { describe, expect, it } from "vitest";
import { loginSchema } from "./login-schema";

describe("loginSchema", () => {
  it("accepts_a_plain_password", () => {
    expect(loginSchema.parse({ password: "correct horse" })).toEqual({ password: "correct horse" });
  });

  it("rejects_old_passwordHash_even_with_password", () => {
    const hash = "a".repeat(64);
    expect(loginSchema.safeParse({ passwordHash: hash }).success).toBe(false);
    expect(loginSchema.safeParse({ password: "secret", passwordHash: hash }).success).toBe(false);
  });

  it("rejects_blank_or_non_string_password", () => {
    for (const password of ["", "   ", 123, null, undefined, ["x"], { x: 1 }]) {
      expect(loginSchema.safeParse({ password }).success).toBe(false);
    }
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse(null).success).toBe(false);
    expect(loginSchema.safeParse("secret").success).toBe(false);
  });

  it("does_not_trim_or_alter_the_password", () => {
    expect(loginSchema.parse({ password: " pad " })).toEqual({ password: " pad " });
  });

  it("rejects_oversized_password", () => {
    expect(loginSchema.safeParse({ password: "x".repeat(1025) }).success).toBe(false);
  });
});
