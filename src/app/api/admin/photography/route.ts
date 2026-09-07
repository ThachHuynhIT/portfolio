import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { PhotoItem, PhotoAlbum } from "@/lib/types";

const FILE = "photography.json";
const ALBUMS_FILE = "photography-albums.json";

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = readJsonFile<PhotoItem[]>(FILE, []);
  const sorted = [...data].sort((a, b) => {
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
    const photos = readJsonFile<PhotoItem[]>(FILE, []);
    const newPhoto: PhotoItem = {
      id: generateId("photo"),
      order: photos.length + 1,
      ...body,
    };
    photos.push(newPhoto);
    writeJsonFile(FILE, photos);

    // Sync with album if assigned
    if (newPhoto.albumId) {
      const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
      const albumIdx = albums.findIndex((a) => a.id === newPhoto.albumId);
      if (albumIdx !== -1) {
        const album = albums[albumIdx];
        const currentIds = album.photoIds || [];
        const updatedPhotoIds = currentIds.includes(newPhoto.id)
          ? currentIds
          : [...currentIds, newPhoto.id];

        // If only 1 photo or no cover, auto set cover to this photo
        let coverImage = album.coverImage;
        let coverPhotoId = album.coverPhotoId;
        if (updatedPhotoIds.length === 1 || !coverImage) {
          coverImage = newPhoto.image;
          coverPhotoId = newPhoto.id;
        }

        albums[albumIdx] = {
          ...album,
          photoIds: updatedPhotoIds,
          coverImage,
          coverPhotoId,
          updatedAt: new Date().toISOString(),
        };
        writeJsonFile(ALBUMS_FILE, albums);
      }
    }

    return NextResponse.json(newPhoto, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to create photo item" }, { status: 500 });
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
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const photos = readJsonFile<PhotoItem[]>(FILE, []);
    const index = photos.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const oldAlbumId = photos[index].albumId;
    const newAlbumId = updates.albumId !== undefined ? updates.albumId : oldAlbumId;

    photos[index] = { ...photos[index], ...updates };
    writeJsonFile(FILE, photos);

    // Sync with albums if album assignment changed or exists
    if (oldAlbumId !== newAlbumId || newAlbumId) {
      const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
      let albumsChanged = false;

      // Remove from old album if reassigned
      if (oldAlbumId && oldAlbumId !== newAlbumId) {
        const oldIdx = albums.findIndex((a) => a.id === oldAlbumId);
        if (oldIdx !== -1) {
          const oldAlbum = albums[oldIdx];
          const newPhotoIds = (oldAlbum.photoIds || []).filter((pid) => pid !== id);
          let newCover = oldAlbum.coverImage;
          let newCoverId = oldAlbum.coverPhotoId;

          if (newPhotoIds.length === 1) {
            const singlePhoto = photos.find((p) => p.id === newPhotoIds[0]);
            if (singlePhoto) {
              newCover = singlePhoto.image;
              newCoverId = singlePhoto.id;
            }
          } else if (oldAlbum.coverPhotoId === id) {
            const fallback = photos.find((p) => p.id === newPhotoIds[0]);
            newCover = fallback ? fallback.image : "";
            newCoverId = fallback ? fallback.id : undefined;
          }

          albums[oldIdx] = {
            ...oldAlbum,
            photoIds: newPhotoIds,
            coverImage: newCover,
            coverPhotoId: newCoverId,
            updatedAt: new Date().toISOString(),
          };
          albumsChanged = true;
        }
      }

      // Add to new album
      if (newAlbumId) {
        const newIdx = albums.findIndex((a) => a.id === newAlbumId);
        if (newIdx !== -1) {
          const newAlbum = albums[newIdx];
          const currentIds = newAlbum.photoIds || [];
          const updatedPhotoIds = currentIds.includes(id)
            ? currentIds
            : [...currentIds, id];

          let coverImage = newAlbum.coverImage;
          let coverPhotoId = newAlbum.coverPhotoId;

          // If only 1 photo in album or no cover image, auto set this photo as cover!
          if (updatedPhotoIds.length === 1 || !coverImage) {
            coverImage = photos[index].image;
            coverPhotoId = photos[index].id;
          }

          albums[newIdx] = {
            ...newAlbum,
            photoIds: updatedPhotoIds,
            coverImage,
            coverPhotoId,
            updatedAt: new Date().toISOString(),
          };
          albumsChanged = true;
        }
      }

      if (albumsChanged) {
        writeJsonFile(ALBUMS_FILE, albums);
      }
    }

    return NextResponse.json(photos[index]);
  } catch (error) {
    console.error("[PUT /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to update photo item" }, { status: 500 });
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
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const photos = readJsonFile<PhotoItem[]>(FILE, []);
    const filtered = photos.filter((p) => p.id !== id);
    if (filtered.length === photos.length) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    writeJsonFile(FILE, filtered);

    // Remove deleted photo from any albums
    const albums = readJsonFile<PhotoAlbum[]>(ALBUMS_FILE, []);
    let albumsChanged = false;
    const updatedAlbums = albums.map((album) => {
      if (album.photoIds?.includes(id)) {
        albumsChanged = true;
        const remainingIds = album.photoIds.filter((pid) => pid !== id);
        let coverImage = album.coverImage;
        let coverPhotoId = album.coverPhotoId;

        // If only 1 photo remaining, auto set as cover
        if (remainingIds.length === 1) {
          const singlePhoto = filtered.find((p) => p.id === remainingIds[0]);
          if (singlePhoto) {
            coverImage = singlePhoto.image;
            coverPhotoId = singlePhoto.id;
          }
        } else if (album.coverPhotoId === id) {
          const fallback = filtered.find((p) => p.id === remainingIds[0]);
          coverImage = fallback ? fallback.image : "";
          coverPhotoId = fallback ? fallback.id : undefined;
        }

        return {
          ...album,
          photoIds: remainingIds,
          coverImage,
          coverPhotoId,
          updatedAt: new Date().toISOString(),
        };
      }
      return album;
    });

    if (albumsChanged) {
      writeJsonFile(ALBUMS_FILE, updatedAlbums);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to delete photo item" }, { status: 500 });
  }
}
