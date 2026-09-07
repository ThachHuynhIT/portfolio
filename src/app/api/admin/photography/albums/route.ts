import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { PhotoAlbum, PhotoItem } from "@/lib/types";

const ALBUMS_FILE = "photography-albums.json";
const PHOTOS_FILE = "photography.json";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
  const sorted = [...albums].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      title_vi,
      slug,
      description,
      description_vi,
      coverImage,
      coverPhotoId,
      photoIds = [],
      featured = false,
      published = true,
      order,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
    const photos = readJsonFile<PhotoItem[]>(PHOTOS_FILE, []);

    // Generate clean unique slug
    let finalSlug = slug ? slugify(slug) : slugify(title);
    if (!finalSlug) finalSlug = `album-${Date.now()}`;
    if (albums.some((a) => a.slug === finalSlug)) {
      finalSlug = `${finalSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    // Determine cover image and cover photo ID
    let finalCover = coverImage;
    let finalCoverPhotoId = coverPhotoId;

    if (!finalCover && photoIds.length > 0) {
      const firstPhoto = photos.find((p) => p.id === photoIds[0]);
      if (firstPhoto) {
        finalCover = firstPhoto.image;
        finalCoverPhotoId = firstPhoto.id;
      }
    }

    const now = new Date().toISOString();
    const newAlbum: PhotoAlbum = {
      id: generateId("album"),
      title: title.trim(),
      title_vi: title_vi?.trim() || undefined,
      slug: finalSlug,
      description: description?.trim() || undefined,
      description_vi: description_vi?.trim() || undefined,
      coverImage: finalCover || "",
      coverPhotoId: finalCoverPhotoId || undefined,
      photoIds: Array.isArray(photoIds) ? photoIds : [],
      featured: Boolean(featured),
      published: published !== false,
      order: typeof order === "number" ? order : albums.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    albums.push(newAlbum);
    writeJsonFile(ALBUMS_FILE, albums);

    // Sync albumId in photos.json
    if (newAlbum.photoIds.length > 0) {
      const updatedPhotos = photos.map((p) => {
        if (newAlbum.photoIds.includes(p.id)) {
          return { ...p, albumId: newAlbum.id };
        }
        return p;
      });
      writeJsonFile(PHOTOS_FILE, updatedPhotos);
    }

    return NextResponse.json(newAlbum, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/photography/albums] Error:", error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
    const index = albums.findIndex((a) => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const existing = albums[index];
    let finalSlug = existing.slug;
    if (updates.slug && updates.slug !== existing.slug) {
      finalSlug = slugify(updates.slug);
      if (albums.some((a) => a.id !== id && a.slug === finalSlug)) {
        finalSlug = `${finalSlug}-${Date.now().toString(36).slice(-4)}`;
      }
    }

    const currentPhotoIds = Array.isArray(updates.photoIds)
      ? updates.photoIds
      : existing.photoIds || [];

    const photos = readJsonFile<PhotoItem[]>(PHOTOS_FILE, []);

    let finalCover = updates.coverImage !== undefined ? updates.coverImage : existing.coverImage;
    let finalCoverPhotoId = updates.coverPhotoId !== undefined ? updates.coverPhotoId : existing.coverPhotoId;

    // If only 1 photo in album, it automatically is the cover image
    if (currentPhotoIds.length === 1) {
      const singlePhoto = photos.find((p) => p.id === currentPhotoIds[0]);
      if (singlePhoto) {
        finalCover = singlePhoto.image;
        finalCoverPhotoId = singlePhoto.id;
      }
    } else if ((!finalCover || !currentPhotoIds.includes(finalCoverPhotoId || "")) && currentPhotoIds.length > 0) {
      const firstPhoto = photos.find((p) => p.id === currentPhotoIds[0]);
      if (firstPhoto) {
        finalCover = firstPhoto.image;
        finalCoverPhotoId = firstPhoto.id;
      }
    }

    const updatedAlbum: PhotoAlbum = {
      ...existing,
      ...updates,
      slug: finalSlug,
      coverImage: finalCover || "",
      coverPhotoId: finalCoverPhotoId || undefined,
      photoIds: currentPhotoIds,
      updatedAt: new Date().toISOString(),
    };

    albums[index] = updatedAlbum;
    writeJsonFile(ALBUMS_FILE, albums);

    // Sync albumId in photos.json
    if (Array.isArray(updates.photoIds)) {
      const newPhotoIds = new Set(updates.photoIds);
      const updatedPhotos = photos.map((p) => {
        if (newPhotoIds.has(p.id)) {
          return { ...p, albumId: id };
        } else if (p.albumId === id) {
          // Unlink photo if removed from album
          const { albumId: _, ...rest } = p;
          return rest as PhotoItem;
        }
        return p;
      });
      writeJsonFile(PHOTOS_FILE, updatedPhotos);
    }

    return NextResponse.json(updatedAlbum);
  } catch (error) {
    console.error("[PUT /api/admin/photography/albums] Error:", error);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
    const filtered = albums.filter((a) => a.id !== id);

    if (filtered.length === albums.length) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    writeJsonFile(ALBUMS_FILE, filtered);

    // Unlink albumId from photos in photos.json
    const photos = readJsonFile<PhotoItem[]>(PHOTOS_FILE, []);
    let photosModified = false;
    const updatedPhotos = photos.map((p) => {
      if (p.albumId === id) {
        photosModified = true;
        const { albumId: _, ...rest } = p;
        return rest as PhotoItem;
      }
      return p;
    });

    if (photosModified) {
      writeJsonFile(PHOTOS_FILE, updatedPhotos);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/photography/albums] Error:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
