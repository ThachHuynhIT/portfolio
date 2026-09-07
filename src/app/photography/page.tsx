import { Metadata } from "next";
import { readJsonFile } from "@/lib/data-manager";
import type { PhotoItem, PhotoAlbum } from "@/lib/types";
import PhotographyGallery from "@/components/photography/PhotographyGallery";

export const metadata: Metadata = {
  title: "Photography & Media Gallery | Visual Showcase",
  description:
    "Explore curated photography, cinematic color grading, and creative post-processing artworks across diverse visual perspectives.",
  openGraph: {
    title: "Photography & Media Gallery | Visual Showcase",
    description:
      "Explore curated photography, cinematic color grading, and creative post-processing artworks.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default function PhotographyPage() {
  const allPhotos = readJsonFile<PhotoItem[]>("photography.json", []);
  const photos = allPhotos.filter((p) => p.published !== false);

  const allAlbums = readJsonFile<PhotoAlbum[]>("photography-albums.json", []);

  // Filter albums:
  // 1. Must be published (published !== false)
  // 2. Must have at least 1 photo ("những album không có hình thì ko show lên bên user")
  // 3. If only 1 photo in album, that photo is automatically the cover!
  const albums: PhotoAlbum[] = allAlbums
    .filter((a) => a.published !== false)
    .map((album) => {
      const albumPhotoIds = new Set(album.photoIds || []);
      const albumPhotos = photos.filter(
        (p) => albumPhotoIds.has(p.id) || p.albumId === album.id
      );

      // Auto-resolve cover photo if only 1 photo or coverImage missing
      const coverImage =
        (albumPhotos.length === 1 ? albumPhotos[0]?.image : album.coverImage) ||
        albumPhotos[0]?.image ||
        album.coverImage;

      const coverPhotoId =
        (albumPhotos.length === 1 ? albumPhotos[0]?.id : album.coverPhotoId) ||
        albumPhotos[0]?.id ||
        album.coverPhotoId;

      const photoIds = Array.from(
        new Set([...(album.photoIds || []), ...albumPhotos.map((p) => p.id)])
      );

      return {
        ...album,
        coverImage,
        coverPhotoId,
        photoIds,
        _count: albumPhotos.length,
      };
    })
    .filter((a) => (a as any)._count > 0)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map(({ _count, ...rest }: any) => rest as PhotoAlbum);

  // Sort by featured first, then by order or date
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return <PhotographyGallery initialPhotos={sortedPhotos} initialAlbums={albums} />;
}
