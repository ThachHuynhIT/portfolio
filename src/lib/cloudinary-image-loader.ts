import type { ImageLoaderProps } from "next/image";

/**
 * Custom next/image loader that rewrites Cloudinary URLs to request an
 * already-resized/optimized variant directly from Cloudinary's CDN
 * (f_auto,q_auto,w_<width>), instead of Next.js's default behavior of
 * proxying every image through its own `/_next/image` server-side
 * optimizer (fetch original -> resize with sharp -> cache -> serve).
 *
 * Non-Cloudinary sources (e.g. an occasional external URL) are returned
 * unchanged since Next.js requires a single loader for all images once
 * `images.loader: "custom"` is set.
 */
export default function cloudinaryImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const uploadMarker = "/upload/";
  const markerIndex = src.indexOf(uploadMarker);

  if (!src.includes("res.cloudinary.com") || markerIndex === -1) {
    return src;
  }

  const transformations = ["f_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`].join(",");
  const before = src.slice(0, markerIndex + uploadMarker.length);
  const after = src.slice(markerIndex + uploadMarker.length);

  return `${before}${transformations}/${after}`;
}
