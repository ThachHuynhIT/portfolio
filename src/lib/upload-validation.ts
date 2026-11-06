// Shared server-side validation for multipart uploads (admin photography,
// admin music, admin media library). Every check that does not need the bytes (presence, size,
// MIME + extension allowlist) runs before `file.arrayBuffer()` so an
// oversized or disallowed part is never buffered; the magic-byte signature
// check runs on the buffered bytes, whose length is already bounded by the
// per-kind cap. Callers validate every part before any upload side effect.
//
// Platform note: this is an app-level cap only. Requests without a
// Content-Length (chunked) are still fully buffered by `req.formData()`
// before the per-file checks run; the effective limit in production is the
// smaller of these caps and the host's request-body limit (e.g. Vercel
// Functions reject bodies over 4.5 MB with 413 before this code runs).

import type { MediaCategory } from "@/lib/types";

export type UploadKind = "photo" | "video" | "audio" | "thumbnail" | "document";
export type PhotoSubType = "processed" | "raw" | "video";
export type UploadErrorStatus = 400 | 413 | 415;

export interface ValidatedUpload {
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

export class UploadValidationError extends Error {
  readonly status: UploadErrorStatus;

  constructor(status: UploadErrorStatus, message: string) {
    super(message);
    this.name = "UploadValidationError";
    this.status = status;
  }
}

const MiB = 1024 * 1024;

export const UPLOAD_LIMITS: Readonly<Record<UploadKind, number>> = {
  photo: 10 * MiB,
  thumbnail: 5 * MiB,
  video: 50 * MiB,
  audio: 50 * MiB,
  document: 10 * MiB,
};

/** Cap for the whole multipart body (largest part + a thumbnail + overhead). */
export const MAX_MULTIPART_BYTES = 60 * MiB;

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

function startsWith(buf: Buffer, bytes: readonly number[], offset = 0): boolean {
  if (buf.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buf[offset + i] === b);
}

function asciiAt(buf: Buffer, offset: number, length: number): string {
  if (buf.length < offset + length) return "";
  return buf.toString("latin1", offset, offset + length);
}

const HEIF_IMAGE_BRANDS = new Set([
  "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1", "avif",
]);

/** Major + compatible brands of a leading ISO-BMFF `ftyp` box, or null. */
function ftypBrands(buf: Buffer): string[] | null {
  if (asciiAt(buf, 4, 4) !== "ftyp") return null;
  const boxSize = buf.readUInt32BE(0);
  const end = Math.min(boxSize >= 16 ? boxSize : 16, buf.length, 256);
  const brands = [asciiAt(buf, 8, 4)];
  for (let offset = 16; offset + 4 <= end; offset += 4) brands.push(asciiAt(buf, offset, 4));
  return brands;
}

const isJpeg = (b: Buffer) => startsWith(b, [0xff, 0xd8, 0xff]);
const isPng = (b: Buffer) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isGif = (b: Buffer) => ["GIF87a", "GIF89a"].includes(asciiAt(b, 0, 6));
const isRiff = (b: Buffer, form: string) => asciiAt(b, 0, 4) === "RIFF" && asciiAt(b, 8, 4) === form;
const isWebp = (b: Buffer) => isRiff(b, "WEBP");
const isWav = (b: Buffer) => isRiff(b, "WAVE");
const isHeif = (b: Buffer) => ftypBrands(b)?.some((brand) => HEIF_IMAGE_BRANDS.has(brand)) ?? false;
/** ISO-BMFF media container (MP4/M4V/M4A) that is not an HEIF still image. */
const isMp4Container = (b: Buffer) => {
  const brands = ftypBrands(b);
  return brands !== null && !HEIF_IMAGE_BRANDS.has(brands[0]);
};
const QUICKTIME_ATOMS = new Set(["moov", "mdat", "wide", "free", "skip", "pnot"]);
const isQuickTime = (b: Buffer) => isMp4Container(b) || QUICKTIME_ATOMS.has(asciiAt(b, 4, 4));
const isWebm = (b: Buffer) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]);
const isMp3 = (b: Buffer) =>
  asciiAt(b, 0, 3) === "ID3" || (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
const isOgg = (b: Buffer) => asciiAt(b, 0, 4) === "OggS";
const isFlac = (b: Buffer) => asciiAt(b, 0, 4) === "fLaC";
const isPdf = (b: Buffer) => asciiAt(b, 0, 5) === "%PDF-";

// ---------------------------------------------------------------------------
// Allowlist
// ---------------------------------------------------------------------------

interface FormatRule {
  extensions: readonly string[];
  mimeTypes: readonly string[];
  matches: (buf: Buffer) => boolean;
}

const IMAGE_RULES: readonly FormatRule[] = [
  { extensions: [".jpg", ".jpeg"], mimeTypes: ["image/jpeg"], matches: isJpeg },
  { extensions: [".png"], mimeTypes: ["image/png"], matches: isPng },
  { extensions: [".webp"], mimeTypes: ["image/webp"], matches: isWebp },
  { extensions: [".gif"], mimeTypes: ["image/gif"], matches: isGif },
  { extensions: [".heic", ".heif"], mimeTypes: ["image/heic", "image/heif"], matches: isHeif },
];

const VIDEO_RULES: readonly FormatRule[] = [
  { extensions: [".mp4", ".m4v"], mimeTypes: ["video/mp4", "video/x-m4v"], matches: isMp4Container },
  { extensions: [".webm"], mimeTypes: ["video/webm"], matches: isWebm },
  { extensions: [".mov"], mimeTypes: ["video/quicktime"], matches: isQuickTime },
];

const AUDIO_RULES: readonly FormatRule[] = [
  { extensions: [".mp3"], mimeTypes: ["audio/mpeg", "audio/mp3"], matches: isMp3 },
  { extensions: [".wav"], mimeTypes: ["audio/wav", "audio/x-wav", "audio/wave"], matches: isWav },
  { extensions: [".m4a"], mimeTypes: ["audio/mp4", "audio/x-m4a"], matches: isMp4Container },
  { extensions: [".ogg", ".oga"], mimeTypes: ["audio/ogg"], matches: isOgg },
  { extensions: [".flac"], mimeTypes: ["audio/flac", "audio/x-flac"], matches: isFlac },
];

const DOCUMENT_RULES: readonly FormatRule[] = [
  { extensions: [".pdf"], mimeTypes: ["application/pdf"], matches: isPdf },
];

const RULES: Readonly<Record<UploadKind, readonly FormatRule[]>> = {
  photo: IMAGE_RULES,
  thumbnail: IMAGE_RULES,
  video: VIDEO_RULES,
  audio: AUDIO_RULES,
  document: DOCUMENT_RULES,
};

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Narrow a FormData entry to an uploaded file (string fields are not files). */
export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && typeof value.arrayBuffer === "function";
}

/** Early 413 from a declared Content-Length; the per-file caps still apply. */
export function assertContentLength(headers: Headers, max = MAX_MULTIPART_BYTES): void {
  const raw = headers.get("content-length");
  if (raw === null) return;
  const declared = Number(raw);
  if (Number.isFinite(declared) && declared > max) {
    throw new UploadValidationError(413, "Request body too large");
  }
}

export async function validateUpload(file: File, kind: UploadKind): Promise<ValidatedUpload> {
  if (file.size === 0) throw new UploadValidationError(400, "File is empty");
  if (file.size > UPLOAD_LIMITS[kind]) {
    throw new UploadValidationError(413, `File exceeds the ${UPLOAD_LIMITS[kind] / MiB} MiB limit`);
  }

  const extension = extensionOf(file.name);
  const declaredMime = file.type.toLowerCase();
  // Some browsers (notably on Windows for HEIC) send no MIME type at all. Fall
  // back to the extension; the signature check below still has to pass.
  const rule = RULES[kind].find(
    (r) =>
      r.extensions.includes(extension) &&
      (declaredMime === "" || r.mimeTypes.includes(declaredMime))
  );
  if (!rule) throw new UploadValidationError(415, "Unsupported file type");
  const mimeType = declaredMime || rule.mimeTypes[0];

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) throw new UploadValidationError(400, "File is empty");
  if (buffer.length > UPLOAD_LIMITS[kind]) {
    throw new UploadValidationError(413, `File exceeds the ${UPLOAD_LIMITS[kind] / MiB} MiB limit`);
  }
  if (!rule.matches(buffer)) {
    throw new UploadValidationError(415, "File content does not match its type");
  }

  return { buffer, mimeType, extension };
}

const MEDIA_KIND_BY_MIME_PREFIX: ReadonlyArray<[string, UploadKind]> = [
  ["image/", "photo"],
  ["video/", "video"],
  ["audio/", "audio"],
  ["application/pdf", "document"],
];

/** Media-library uploads accept any supported kind; pick it from MIME or extension. */
export function mediaUploadKind(file: File): UploadKind {
  const mime = file.type.toLowerCase();
  if (mime) {
    const match = MEDIA_KIND_BY_MIME_PREFIX.find(([prefix]) => mime.startsWith(prefix));
    if (match) return match[1];
    throw new UploadValidationError(415, "Unsupported file type");
  }
  const extension = extensionOf(file.name);
  const kinds: UploadKind[] = ["photo", "video", "audio", "document"];
  const kind = kinds.find((k) => RULES[k].some((r) => r.extensions.includes(extension)));
  if (!kind) throw new UploadValidationError(415, "Unsupported file type");
  return kind;
}

const MEDIA_CATEGORIES = [
  "music", "photo", "project", "blog", "site", "couple", "general",
] as const satisfies readonly MediaCategory[];
export type MediaUploadCategory = (typeof MEDIA_CATEGORIES)[number];

export function parseMediaCategory(value: unknown): MediaUploadCategory {
  if (value === null || value === undefined || value === "") return "general";
  if (typeof value === "string" && (MEDIA_CATEGORIES as readonly string[]).includes(value)) {
    return value as MediaUploadCategory;
  }
  throw new UploadValidationError(400, "Invalid category");
}

/** Free-form media sub-types end up in Cloudinary public IDs: slug characters only. */
export function parseMediaSubType(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string" && /^[a-z0-9-]{1,32}$/.test(value)) return value;
  throw new UploadValidationError(400, "Invalid sub-type");
}

const PHOTO_SUB_TYPES: readonly PhotoSubType[] = ["processed", "raw", "video"];

function isPhotoSubType(value: unknown): value is PhotoSubType {
  return typeof value === "string" && (PHOTO_SUB_TYPES as readonly string[]).includes(value);
}

/**
 * Resolve the photography sub-type from the form. Only the enum values are
 * accepted (anything else is a 400, never sanitized into a path segment);
 * videos are always "video" and "isBefore" forces "raw" for images.
 */
export function parsePhotoSubType(value: unknown, isBefore: boolean, isVideo: boolean): PhotoSubType {
  const provided = value === null || value === undefined || value === "" ? null : value;
  if (provided !== null && !isPhotoSubType(provided)) {
    throw new UploadValidationError(400, "Invalid subType");
  }
  if (isVideo) return "video";
  if (provided === "video") throw new UploadValidationError(400, "Invalid subType");
  if (isBefore || provided === "raw") return "raw";
  return "processed";
}
