import { z } from "zod";

// Input contracts for admin track writes (POST /api/music/tracks,
// PATCH /api/music/tracks/[id]). Strict objects: id, playCount, timestamps
// and any unknown key are rejected rather than silently dropped.

/** Track.duration / Track.order are Postgres INT4 columns. */
const INT4_MAX = 2_147_483_647;

const requiredText = z.string().trim().min(1).max(200);

/** Optional free text: blank ("" / whitespace) is stored as null. */
const optionalText = z
  .string()
  .trim()
  .max(200)
  .transform((value) => (value === "" ? null : value))
  .nullable();

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be an HTTPS URL");

const seconds = z.number().int().nonnegative().max(INT4_MAX);
const sortOrder = z.number().int().nonnegative().max(INT4_MAX);

const trackFields = {
  title: requiredText,
  artist: requiredText,
  album: optionalText,
  genre: optionalText,
  duration: seconds,
  audioUrl: httpsUrl,
  thumbnailUrl: httpsUrl.nullable(),
  order: sortOrder,
  published: z.boolean(),
};

export const createTrackSchema = z
  .object({
    ...trackFields,
    album: trackFields.album.optional().transform((value) => value ?? null),
    genre: trackFields.genre.optional().transform((value) => value ?? null),
    thumbnailUrl: trackFields.thumbnailUrl.optional().transform((value) => value ?? null),
    duration: trackFields.duration.default(0),
    order: trackFields.order.default(0),
    published: trackFields.published.default(true),
  })
  .strict();

export const patchTrackSchema = z
  .object(trackFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export type CreateTrackInput = z.infer<typeof createTrackSchema>;
export type PatchTrackInput = z.infer<typeof patchTrackSchema>;

/**
 * HTTP status for a failed track write: only Prisma's "record not found"
 * (P2025) is a 404 and a unique-constraint violation (P2002) a 409; every
 * other failure (connection, timeout, unknown) is a 500.
 */
export function trackWriteErrorStatus(error: unknown): 404 | 409 | 500 {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;
  if (code === "P2025") return 404;
  if (code === "P2002") return 409;
  return 500;
}

/** Flatten zod issues into a small client-safe list. */
export function describeIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
}
