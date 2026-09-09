import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { generateId } from "@/lib/data-manager";
import type { PhotoItem, PhotoAlbum } from "@/lib/types";
import type { CmsPhoto, CmsPhotoAlbum, Prisma } from "@/generated/prisma";

type TxClient = Prisma.TransactionClient;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toPhoto(row: CmsPhoto): PhotoItem {
  return {
    id: row.id,
    title: row.title,
    title_vi: row.titleVi ?? undefined,
    description: row.description ?? undefined,
    description_vi: row.descriptionVi ?? undefined,
    location: row.location ?? undefined,
    location_vi: row.locationVi ?? undefined,
    category: row.category,
    tags: row.tags,
    image: row.image,
    beforeImage: row.beforeImage ?? undefined,
    mediaType: row.mediaType as PhotoItem["mediaType"],
    videoUrl: row.videoUrl ?? undefined,
    aspectRatio: row.aspectRatio as PhotoItem["aspectRatio"],
    featured: row.featured,
    published: row.published,
    date: row.date,
    camera: (row.camera as PhotoItem["camera"]) ?? undefined,
    editing: (row.editing as PhotoItem["editing"]) ?? undefined,
    order: row.order,
    albumId: row.albumId ?? undefined,
  };
}

function toAlbum(row: CmsPhotoAlbum, photoIds: string[]): PhotoAlbum {
  return {
    id: row.id,
    title: row.title,
    title_vi: row.titleVi ?? undefined,
    slug: row.slug,
    description: row.description ?? undefined,
    description_vi: row.descriptionVi ?? undefined,
    coverImage: row.coverImage,
    coverPhotoId: row.coverPhotoId ?? undefined,
    photoIds,
    order: row.order,
    featured: row.featured,
    published: row.published,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const sortByFeaturedThenOrder = <T extends { featured?: boolean; order?: number }>(items: T[]) =>
  [...items].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

async function fetchAlbumWithPhotoIds(tx: TxClient, id: string): Promise<PhotoAlbum | null> {
  const row = await tx.cmsPhotoAlbum.findUnique({ where: { id } });
  if (!row) return null;
  const photos = await tx.cmsPhoto.findMany({ where: { albumId: id }, select: { id: true } });
  return toAlbum(row, photos.map((p) => p.id));
}

/**
 * Reapplies the "album with exactly 1 photo, or with no cover set, auto-adopts
 * a photo as its cover" heuristic from the original JSON-backed routes.
 */
async function recomputeAlbumCover(tx: TxClient, albumId: string): Promise<void> {
  const album = await tx.cmsPhotoAlbum.findUnique({ where: { id: albumId } });
  if (!album) return;
  const photos = await tx.cmsPhoto.findMany({
    where: { albumId },
    orderBy: { createdAt: "asc" },
    select: { id: true, image: true },
  });

  if (photos.length === 1) {
    await tx.cmsPhotoAlbum.update({
      where: { id: albumId },
      data: { coverImage: photos[0].image, coverPhotoId: photos[0].id },
    });
    return;
  }

  const coverStillValid = album.coverPhotoId && photos.some((p) => p.id === album.coverPhotoId);
  if (!album.coverImage || !coverStillValid) {
    const fallback = photos[0];
    await tx.cmsPhotoAlbum.update({
      where: { id: albumId },
      data: {
        coverImage: fallback?.image ?? "",
        coverPhotoId: fallback?.id ?? null,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export async function listPhotos(): Promise<PhotoItem[]> {
  const rows = await db.cmsPhoto.findMany();
  return sortByFeaturedThenOrder(rows.map(toPhoto));
}

export async function createPhoto(input: Omit<PhotoItem, "id">): Promise<PhotoItem> {
  const count = await db.cmsPhoto.count();
  const row = await db.$transaction(async (tx) => {
    const created = await tx.cmsPhoto.create({
      data: {
        id: generateId("photo"),
        title: input.title,
        titleVi: input.title_vi,
        description: input.description,
        descriptionVi: input.description_vi,
        location: input.location,
        locationVi: input.location_vi,
        category: input.category,
        tags: input.tags ?? [],
        image: input.image,
        beforeImage: input.beforeImage,
        mediaType: input.mediaType ?? "image",
        videoUrl: input.videoUrl,
        aspectRatio: input.aspectRatio ?? "landscape",
        featured: input.featured ?? false,
        published: input.published !== false,
        date: input.date,
        camera: (input.camera ?? undefined) as Prisma.InputJsonValue | undefined,
        editing: (input.editing ?? undefined) as Prisma.InputJsonValue | undefined,
        order: count + 1,
        albumId: input.albumId || null,
      },
    });
    if (created.albumId) await recomputeAlbumCover(tx, created.albumId);
    return created;
  });
  return toPhoto(row);
}

export async function updatePhoto(id: string, updates: Partial<PhotoItem>): Promise<PhotoItem | null> {
  try {
    const row = await db.$transaction(async (tx) => {
      const existing = await tx.cmsPhoto.findUniqueOrThrow({ where: { id } });
      const oldAlbumId = existing.albumId;
      const newAlbumId = updates.albumId !== undefined ? updates.albumId || null : oldAlbumId;

      const updated = await tx.cmsPhoto.update({
        where: { id },
        data: {
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.title_vi !== undefined && { titleVi: updates.title_vi }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.description_vi !== undefined && { descriptionVi: updates.description_vi }),
          ...(updates.location !== undefined && { location: updates.location }),
          ...(updates.location_vi !== undefined && { locationVi: updates.location_vi }),
          ...(updates.category !== undefined && { category: updates.category }),
          ...(updates.tags !== undefined && { tags: updates.tags }),
          ...(updates.image !== undefined && { image: updates.image }),
          ...(updates.beforeImage !== undefined && { beforeImage: updates.beforeImage }),
          ...(updates.mediaType !== undefined && { mediaType: updates.mediaType }),
          ...(updates.videoUrl !== undefined && { videoUrl: updates.videoUrl }),
          ...(updates.aspectRatio !== undefined && { aspectRatio: updates.aspectRatio }),
          ...(updates.featured !== undefined && { featured: updates.featured }),
          ...(updates.published !== undefined && { published: updates.published }),
          ...(updates.date !== undefined && { date: updates.date }),
          ...(updates.camera !== undefined && { camera: updates.camera as Prisma.InputJsonValue }),
          ...(updates.editing !== undefined && { editing: updates.editing as Prisma.InputJsonValue }),
          ...(updates.order !== undefined && { order: updates.order }),
          ...(updates.albumId !== undefined && { albumId: newAlbumId as string | null }),
        },
      });

      if (oldAlbumId !== newAlbumId) {
        if (oldAlbumId) await recomputeAlbumCover(tx, oldAlbumId);
        if (newAlbumId) await recomputeAlbumCover(tx, newAlbumId);
      }

      return updated;
    });
    return toPhoto(row);
  } catch {
    return null;
  }
}

export async function deletePhoto(id: string): Promise<boolean> {
  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.cmsPhoto.findUniqueOrThrow({ where: { id } });
      await tx.cmsPhoto.delete({ where: { id } });
      if (existing.albumId) await recomputeAlbumCover(tx, existing.albumId);
    });
    return true;
  } catch {
    return false;
  }
}

export const getPublishedPhotos = unstable_cache(
  async (): Promise<PhotoItem[]> => {
    const rows = await db.cmsPhoto.findMany({ where: { published: true } });
    return sortByFeaturedThenOrder(rows.map(toPhoto));
  },
  ["published-photos"],
  { tags: ["photography"] }
);

// ---------------------------------------------------------------------------
// Albums
// ---------------------------------------------------------------------------

async function withPhotoIds(rows: CmsPhotoAlbum[]): Promise<PhotoAlbum[]> {
  const albums = await Promise.all(
    rows.map(async (row) => {
      const photos = await db.cmsPhoto.findMany({ where: { albumId: row.id }, select: { id: true } });
      return toAlbum(row, photos.map((p) => p.id));
    })
  );
  return sortByFeaturedThenOrder(albums);
}

export async function listAlbums(): Promise<PhotoAlbum[]> {
  const rows = await db.cmsPhotoAlbum.findMany();
  return withPhotoIds(rows);
}

async function resolveUniqueSlug(tx: TxClient, desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || `album-${Date.now()}`;
  const clash = await tx.cmsPhotoAlbum.findFirst({
    where: { slug: base, ...(excludeId && { id: { not: excludeId } }) },
  });
  if (!clash) return base;
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export async function createAlbum(
  input: Omit<PhotoAlbum, "id" | "createdAt" | "updatedAt"> & { photoIds?: string[] }
): Promise<PhotoAlbum> {
  const count = await db.cmsPhotoAlbum.count();
  const result = await db.$transaction(async (tx) => {
    const slug = await resolveUniqueSlug(tx, input.slug || input.title);
    const photoIds = input.photoIds ?? [];

    let coverImage = input.coverImage || "";
    let coverPhotoId = input.coverPhotoId || null;
    if (!coverImage && photoIds.length > 0) {
      const first = await tx.cmsPhoto.findUnique({ where: { id: photoIds[0] } });
      if (first) {
        coverImage = first.image;
        coverPhotoId = first.id;
      }
    }

    const album = await tx.cmsPhotoAlbum.create({
      data: {
        id: generateId("album"),
        title: input.title,
        titleVi: input.title_vi,
        slug,
        description: input.description,
        descriptionVi: input.description_vi,
        coverImage,
        coverPhotoId,
        order: input.order ?? count + 1,
        featured: input.featured ?? false,
        published: input.published !== false,
      },
    });

    if (photoIds.length > 0) {
      await tx.cmsPhoto.updateMany({ where: { id: { in: photoIds } }, data: { albumId: album.id } });
    }
    await recomputeAlbumCover(tx, album.id);
    return fetchAlbumWithPhotoIds(tx, album.id);
  });
  return result as PhotoAlbum;
}

export async function updateAlbum(
  id: string,
  updates: Partial<PhotoAlbum> & { photoIds?: string[] }
): Promise<PhotoAlbum | null> {
  try {
    const result = await db.$transaction(async (tx) => {
      const slug =
        updates.slug !== undefined
          ? await resolveUniqueSlug(tx, updates.slug, id)
          : undefined;

      await tx.cmsPhotoAlbum.update({
        where: { id },
        data: {
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.title_vi !== undefined && { titleVi: updates.title_vi }),
          ...(slug !== undefined && { slug }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.description_vi !== undefined && { descriptionVi: updates.description_vi }),
          ...(updates.coverImage !== undefined && { coverImage: updates.coverImage }),
          ...(updates.coverPhotoId !== undefined && { coverPhotoId: updates.coverPhotoId }),
          ...(updates.order !== undefined && { order: updates.order }),
          ...(updates.featured !== undefined && { featured: updates.featured }),
          ...(updates.published !== undefined && { published: updates.published }),
        },
      });

      if (Array.isArray(updates.photoIds)) {
        const newIds = updates.photoIds;
        await tx.cmsPhoto.updateMany({
          where: { albumId: id, id: { notIn: newIds } },
          data: { albumId: null },
        });
        if (newIds.length > 0) {
          await tx.cmsPhoto.updateMany({ where: { id: { in: newIds } }, data: { albumId: id } });
        }
      }

      await recomputeAlbumCover(tx, id);
      return fetchAlbumWithPhotoIds(tx, id);
    });
    return result;
  } catch {
    return null;
  }
}

export async function deleteAlbum(id: string): Promise<boolean> {
  try {
    // onDelete: SetNull on CmsPhoto.albumId unlinks any photos automatically.
    await db.cmsPhotoAlbum.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export const getPublishedAlbums = unstable_cache(
  async (): Promise<PhotoAlbum[]> => {
    const rows = await db.cmsPhotoAlbum.findMany({ where: { published: true } });
    return withPhotoIds(rows);
  },
  ["published-albums"],
  { tags: ["photography"] }
);
