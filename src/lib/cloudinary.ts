import { v2 as cloudinary } from "cloudinary";

// ---------------------------------------------------------------------------
// Cloudinary client — configured once from environment variables.
// Import this module anywhere you need to upload / transform images.
// ---------------------------------------------------------------------------

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always use https
});

export { cloudinary };

// ---------------------------------------------------------------------------
// Upload helper — uploads a file (Buffer or base-64 data-URI) to Cloudinary
// and returns the resulting secure URL.
// ---------------------------------------------------------------------------

export interface UploadOptions {
  /** Cloudinary folder to place the asset in. */
  folder?: string;
  /** Optional public_id override. Defaults to a random id. */
  publicId?: string;
  /** Max file size in bytes (default 10 MB). */
  maxBytes?: number;
}

export interface UploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a base-64 data-URI or a remote URL to Cloudinary.
 *
 * @example
 * const result = await uploadImage(dataUri, { folder: "portfolio/projects" });
 * console.log(result.url); // https://res.cloudinary.com/…
 */
export async function uploadImage(
  source: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = "portfolio", publicId, maxBytes = 10 * 1024 * 1024 } = options;

  // Guard: reject oversized base-64 payloads early
  // Base-64 size = ceil(bytes / 3) * 4 — rough check
  if (source.startsWith("data:") && source.length * 0.75 > maxBytes) {
    throw new Error(`File exceeds maximum allowed size of ${maxBytes} bytes.`);
  }

  const result = await cloudinary.uploader.upload(source, {
    folder,
    ...(publicId ? { public_id: publicId } : {}),
    overwrite: !!publicId,
    resource_type: "image",
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Build an optimised delivery URL with on-the-fly transforms.
 *
 * @example
 * const src = getOptimisedUrl("portfolio/projects/hero", { width: 800, quality: "auto" });
 */
export function getOptimisedUrl(
  publicId: string,
  transforms: Record<string, string | number> = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
    ...transforms,
  });
}
