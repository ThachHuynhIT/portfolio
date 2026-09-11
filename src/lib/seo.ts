import type { Metadata } from "next";
import { insertCloudinaryTransform } from "./cloudinary-image-loader";

const OG_IMAGE_TRANSFORM = "w_1200,h_630,c_fill,g_auto";

// Cloudinary URLs support on-the-fly transforms via a URL segment, so
// resizing to the 1200x630 social platforms expect for OG images doesn't
// need a new upload/transform pipeline — just this URL rewrite (shared with
// cloudinary-image-loader.ts, which does the equivalent per-request resize
// for next/image). A non-Cloudinary URL is left untouched (dimensions
// unknown).
export function toOgImage(url: string): {
  url: string;
  width?: number;
  height?: number;
} {
  const resized = insertCloudinaryTransform(url, OG_IMAGE_TRANSFORM);
  if (resized === url) {
    return { url };
  }
  return { url: resized, width: 1200, height: 630 };
}

type BuildMetadataInput = {
  title?: string | null;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  siteName?: string | null;
};

// Shared across every public page's metadata/generateMetadata so
// canonical/OG/twitter stay consistent without repeating the same
// three-object shape on every page. Omits title/description keys entirely
// when not provided so Next.js falls back to the root layout's title
// template. Relies on `metadataBase` being set on the root layout so the
// relative `path` here resolves to an absolute URL.
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  siteName,
}: BuildMetadataInput): Metadata {
  const images = image ? [toOgImage(image)] : undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: {
      url: path,
      type,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(siteName ? { siteName } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(images ? { images } : {}),
    },
  };
}
