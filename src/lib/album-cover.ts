import type { PhotoAlbum } from "@/lib/types";

/** The fields of an album member needed to build its public view. */
export interface AlbumMember {
  id: string;
  image: string;
  published: boolean;
}

/**
 * Public view of an album: only published members count, and the cover is
 * resolved from them so a hidden photo can never leak as a cover and a
 * replaced image never shows a stale URL.
 *
 * `members` must be in the album's natural order (oldest first) — the first
 * published member is the fallback cover, matching recomputeAlbumCover().
 * A cover URL with no `coverPhotoId` is a custom cover and is kept as is.
 */
export function toPublicAlbum(album: PhotoAlbum, members: AlbumMember[]): PhotoAlbum {
  const visible = members.filter((m) => m.published);
  const fallback = visible[0]?.image ?? "";

  let coverImage: string;
  if (album.coverPhotoId) {
    coverImage = visible.find((m) => m.id === album.coverPhotoId)?.image ?? fallback;
  } else {
    coverImage = album.coverImage || fallback;
  }

  return { ...album, coverImage, photoIds: visible.map((m) => m.id) };
}
