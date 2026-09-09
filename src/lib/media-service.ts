import path from "path";
import { cloudinary } from "@/lib/cloudinary";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { MediaAsset, MediaCategory } from "@/lib/types";

const REGISTRY_FILE = "media-registry.json";

/**
 * Clean & slugify string: remove Vietnamese accents, symbols, whitespace to dash
 */
export function sanitizeFilename(name: string): string {
  if (!name) return "file";

  // Remove extension if present
  const ext = path.extname(name);
  let base = ext ? name.slice(0, -ext.length) : name;

  // Remove Vietnamese accents / diacritics
  base = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  // Keep only alphanumeric and dashes
  base = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Truncate to reasonable length
  return base.slice(0, 35) || "media";
}

/**
 * Determine Cloudinary folder based on category and subType
 */
export function getCloudinaryFolder(category: MediaCategory, subType?: string): string {
  switch (category) {
    case "music":
      if (subType === "audio") return "portfolio/music/audio";
      if (subType === "thumb") return "portfolio/music/thumbnails";
      return "portfolio/music";
    case "photo":
      if (subType === "video") return "portfolio/photography/videos";
      return "portfolio/photography/photos";
    case "project":
      return "portfolio/projects";
    case "blog":
      return "portfolio/blog";
    case "site":
      return "portfolio/site";
    case "couple":
      return "portfolio/couple";
    case "general":
    default:
      return "portfolio/general";
  }
}

/**
 * Generate standardized public ID and filename with category prefix
 */
export function generateMediaFilename(options: {
  category: MediaCategory;
  subType?: string;
  originalName?: string;
}): { filename: string; folder: string } {
  const { category, subType, originalName } = options;
  const cleanName = sanitizeFilename(originalName || "upload");
  const timestamp = Date.now();
  const subPrefix = subType ? `${subType}-` : "";
  const filename = `${category}-${subPrefix}${cleanName}-${timestamp}`;
  const folder = getCloudinaryFolder(category, subType);

  return { filename, folder };
}

/**
 * Convert HEIC buffer to JPEG buffer if needed
 */
export async function convertHeicIfNeeded(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string; isConverted: boolean }> {
  const ext = (path.extname(filename) || "").toLowerCase();
  const isHeic =
    [".heic", ".heif"].includes(ext) ||
    mimeType === "image/heic" ||
    mimeType === "image/heif";

  if (isHeic) {
    try {
      // Lazy-load heic-convert only when converting an actual HEIC file
      // @ts-expect-error heic-convert does not provide official TS declarations
      const { default: convertHeic } = await import("heic-convert");
      const converted = await convertHeic({
        buffer,
        format: "JPEG",
        quality: 0.92,
      });
      return {
        buffer: Buffer.from(converted),
        mimeType: "image/jpeg",
        isConverted: true,
      };
    } catch (err) {
      console.warn("[MediaService] Failed to convert HEIC to JPEG:", err);
    }
  }

  return { buffer, mimeType, isConverted: false };
}

/**
 * Upload a media file buffer / data-URI to Cloudinary and register in media-registry.json
 */
export async function uploadAndRegisterMedia(
  source: Buffer | string,
  options: {
    category: MediaCategory;
    subType?: string;
    originalName?: string;
    mimeType?: string;
    resourceType?: "image" | "video" | "raw" | "auto";
    tags?: string[];
  }
): Promise<MediaAsset> {
  const { category, subType, originalName = "upload", tags = [] } = options;

  let sourcePayload = source;
  let finalMime = options.mimeType || "image/jpeg";

  // If buffer, check HEIC and convert to dataUri
  if (Buffer.isBuffer(source)) {
    const checkHeic = await convertHeicIfNeeded(source, originalName, finalMime);
    finalMime = checkHeic.mimeType;
    const base64 = checkHeic.buffer.toString("base64");
    sourcePayload = `data:${finalMime};base64,${base64}`;
  }

  const { filename, folder } = generateMediaFilename({
    category,
    subType,
    originalName,
  });

  // Infer resource type if auto or not specified
  let resType: "image" | "video" | "raw" = "image";
  if (options.resourceType && options.resourceType !== "auto") {
    resType = options.resourceType;
  } else {
    const ext = path.extname(originalName).toLowerCase();
    if (
      finalMime.startsWith("video/") ||
      finalMime.startsWith("audio/") ||
      [".mp4", ".mov", ".webm", ".mkv", ".mp3", ".wav", ".aac", ".ogg", ".flac"].includes(ext)
    ) {
      resType = "video"; // Cloudinary uses video resource_type for both audio and video
    }
  }

  const mergedTags = Array.from(
    new Set(["portfolio", category, subType, ...tags].filter(Boolean) as string[])
  );

  const uploadResult = await cloudinary.uploader.upload(sourcePayload as string, {
    folder,
    public_id: filename,
    resource_type: resType,
    tags: mergedTags,
  });

  const asset: MediaAsset = {
    id: generateId("media"),
    publicId: uploadResult.public_id,
    filename: `${filename}.${uploadResult.format || uploadResult.resource_type || "bin"}`,
    url: uploadResult.url,
    secureUrl: uploadResult.secure_url,
    category,
    subType,
    format: uploadResult.format || path.extname(originalName).replace(".", "") || "unknown",
    bytes: uploadResult.bytes || 0,
    width: uploadResult.width,
    height: uploadResult.height,
    duration: uploadResult.duration,
    resourceType: uploadResult.resource_type as "image" | "video" | "raw",
    tags: mergedTags,
    createdAt: uploadResult.created_at || new Date().toISOString(),
  };

  saveMediaAsset(asset);
  return asset;
}

/**
 * Retrieve all media assets from the registry with optional filtering and sorting
 */
export function getMediaAssets(filters?: {
  category?: string;
  resourceType?: string;
  search?: string;
}): MediaAsset[] {
  const assets = readJsonFile<MediaAsset[]>(REGISTRY_FILE, []);

  return assets
    .filter((item) => {
      // Category filter
      if (filters?.category && filters.category !== "all" && item.category !== filters.category) {
        return false;
      }
      // Resource type filter (image, video, audio)
      if (filters?.resourceType && filters.resourceType !== "all") {
        if (filters.resourceType === "audio") {
          const isAudio =
            item.subType === "audio" ||
            ["mp3", "wav", "aac", "ogg", "flac"].includes(item.format.toLowerCase());
          if (!isAudio) return false;
        } else if (filters.resourceType === "video") {
          const isAudio =
            item.subType === "audio" ||
            ["mp3", "wav", "aac", "ogg", "flac"].includes(item.format.toLowerCase());
          if (item.resourceType !== "video" || isAudio) return false;
        } else if (item.resourceType !== filters.resourceType) {
          return false;
        }
      }
      // Keyword search
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = item.filename.toLowerCase().includes(q);
        const matchesPublicId = item.publicId.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesSub = item.subType ? item.subType.toLowerCase().includes(q) : false;
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));

        if (!matchesName && !matchesPublicId && !matchesCategory && !matchesSub && !matchesTags) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Save / update an asset in the registry
 */
export function saveMediaAsset(asset: MediaAsset): void {
  const assets = readJsonFile<MediaAsset[]>(REGISTRY_FILE, []);
  const index = assets.findIndex((a) => a.publicId === asset.publicId);

  if (index >= 0) {
    assets[index] = { ...assets[index], ...asset };
  } else {
    assets.unshift(asset);
  }

  writeJsonFile(REGISTRY_FILE, assets);
}

/**
 * Delete a media asset from Cloudinary and remove from the registry
 */
export async function deleteMediaAsset(publicId: string): Promise<boolean> {
  const assets = readJsonFile<MediaAsset[]>(REGISTRY_FILE, []);
  const asset = assets.find((a) => a.publicId === publicId);

  try {
    const resType = asset?.resourceType || "image";
    await cloudinary.uploader.destroy(publicId, { resource_type: resType });
  } catch (err) {
    console.warn(`[MediaService] Cloudinary destroy failed for ${publicId}:`, err);
  }

  const remaining = assets.filter((a) => a.publicId !== publicId);
  writeJsonFile(REGISTRY_FILE, remaining);
  return true;
}

/**
 * Deduce media category and subType from existing Cloudinary public_id or folder path
 */
function inferCategoryFromPublicId(publicId: string): {
  category: MediaCategory;
  subType?: string;
} {
  const lower = publicId.toLowerCase();
  if (lower.includes("/music/audio") || lower.startsWith("music-audio")) {
    return { category: "music", subType: "audio" };
  }
  if (lower.includes("/music/thumbnails") || lower.startsWith("music-thumb")) {
    return { category: "music", subType: "thumb" };
  }
  if (lower.includes("/music")) {
    return { category: "music" };
  }
  if (lower.includes("/photography/videos") || lower.startsWith("photo-video")) {
    return { category: "photo", subType: "video" };
  }
  if (lower.includes("/photography") || lower.startsWith("photo-")) {
    return { category: "photo", subType: "processed" };
  }
  if (lower.includes("/projects") || lower.startsWith("proj-") || lower.startsWith("project-")) {
    return { category: "project", subType: "cover" };
  }
  if (lower.includes("/blog") || lower.startsWith("blog-")) {
    return { category: "blog", subType: "cover" };
  }
  if (lower.includes("/site") || lower.startsWith("site-")) {
    return { category: "site" };
  }
  return { category: "general" };
}

/**
 * Sync existing assets from Cloudinary (scans portfolio/ folder) into the local registry
 */
export async function syncAssetsFromCloudinary(): Promise<{
  added: number;
  total: number;
}> {
  const existingAssets = readJsonFile<MediaAsset[]>(REGISTRY_FILE, []);
  const existingPublicIds = new Set(existingAssets.map((a) => a.publicId));

  let addedCount = 0;

  // Fetch images and videos/audio from Cloudinary in parallel (independent API calls)
  const [imageResult, videoResult] = await Promise.allSettled([
    cloudinary.api.resources({
      type: "upload",
      prefix: "portfolio",
      max_results: 500,
    }),
    cloudinary.api.resources({
      resource_type: "video",
      type: "upload",
      prefix: "portfolio",
      max_results: 500,
    }),
  ]);

  // 1. Process images
  if (imageResult.status === "fulfilled") {
    const resources = imageResult.value.resources;
    if (resources && Array.isArray(resources)) {
      for (const res of resources) {
        if (!existingPublicIds.has(res.public_id)) {
          const { category, subType } = inferCategoryFromPublicId(res.public_id);
          const filename = path.basename(res.public_id) + `.${res.format || "jpg"}`;

          existingAssets.push({
            id: generateId("media"),
            publicId: res.public_id,
            filename,
            url: res.url,
            secureUrl: res.secure_url,
            category,
            subType,
            format: res.format || "jpg",
            bytes: res.bytes || 0,
            width: res.width,
            height: res.height,
            resourceType: "image",
            tags: ["portfolio", category, subType].filter(Boolean) as string[],
            createdAt: res.created_at || new Date().toISOString(),
          });
          existingPublicIds.add(res.public_id);
          addedCount++;
        }
      }
    }
  } else {
    console.error("[MediaService] Error scanning images from Cloudinary:", imageResult.reason);
  }

  // 2. Process videos & audio
  if (videoResult.status === "fulfilled") {
    const resources = videoResult.value.resources;
    if (resources && Array.isArray(resources)) {
      for (const res of resources) {
        if (!existingPublicIds.has(res.public_id)) {
          const { category, subType } = inferCategoryFromPublicId(res.public_id);
          const filename = path.basename(res.public_id) + `.${res.format || "mp4"}`;

          existingAssets.push({
            id: generateId("media"),
            publicId: res.public_id,
            filename,
            url: res.url,
            secureUrl: res.secure_url,
            category,
            subType,
            format: res.format || "mp4",
            bytes: res.bytes || 0,
            width: res.width,
            height: res.height,
            duration: res.duration,
            resourceType: "video",
            tags: ["portfolio", category, subType].filter(Boolean) as string[],
            createdAt: res.created_at || new Date().toISOString(),
          });
          existingPublicIds.add(res.public_id);
          addedCount++;
        }
      }
    }
  } else {
    console.error("[MediaService] Error scanning videos/audios from Cloudinary:", videoResult.reason);
  }

  // Sort and save updated registry
  existingAssets.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  writeJsonFile(REGISTRY_FILE, existingAssets);

  return { added: addedCount, total: existingAssets.length };
}
