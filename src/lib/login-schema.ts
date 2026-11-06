import { z } from "zod";

// Shared by the login form (zodResolver) and POST /api/admin/auth. Strict so
// the legacy `{ passwordHash }` payload (client-side SHA-256) is rejected
// instead of being silently ignored. The password is never trimmed or
// otherwise altered; whitespace-only input just counts as blank.
export const loginSchema = z.strictObject({
  password: z
    .string()
    .max(1024)
    .refine((value) => value.trim().length > 0, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
