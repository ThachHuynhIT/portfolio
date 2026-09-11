import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_UPLOAD_MARKER = "/upload/";

/**
 * Insert a Cloudinary transformation string (e.g. "f_auto,w_400") right
 * after the "/upload/" segment of a Cloudinary delivery URL. Shared by this
 * loader (per-request width/quality) and src/lib/seo.ts's toOgImage (a fixed
 * OG-image size) so the URL-splicing logic only lives in one place. Returns
 * the URL unchanged if it isn't a recognizable Cloudinary upload URL.
 */
export function insertCloudinaryTransform(url: string, transformation: string): string {
  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) return url;

  const insertAt = markerIndex + CLOUDINARY_UPLOAD_MARKER.length;
  return `${url.slice(0, insertAt)}${transformation}/${url.slice(insertAt)}`;
}

/**
 * Custom next/image loader that rewrites Cloudinary URLs to request an
 * already-resized/optimized variant directly from Cloudinary's CDN
 * (f_auto,q_auto,w_<width>), instead of Next.js's default behavior of
 * proxying every image through its own `/_next/image` server-side
 * optimizer (fetch original -> resize with sharp -> cache -> serve).
 *
 * Unsplash source images (used for a handful of seed/placeholder photos)
 * support the same `w`/`q` resize-via-query-param convention, so those are
 * rewritten too rather than left at their hardcoded fixed size.
 *
 * Any other external URL is returned unchanged since Next.js requires a
 * single loader for all images once `images.loader: "custom"` is set —
 * such a source won't be resized, but there are none in this app today.
 */
export default function cloudinaryImageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (src.includes("res.cloudinary.com")) {
    const transformations = ["f_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`].join(",");
    return insertCloudinaryTransform(src, transformations);
  }

  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 80));
    return url.toString();
  }

  return src;
}
