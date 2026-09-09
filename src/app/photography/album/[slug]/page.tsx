import { Metadata } from "next";
import { notFound } from "next/navigation";
import { readJsonFile } from "@/lib/data-manager";
import type { PhotoAlbum, PhotoItem } from "@/lib/types";
import AlbumDetailView from "@/components/photography/AlbumDetailView";

interface AlbumPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const albums = readJsonFile<PhotoAlbum[]>("photography-albums.json", []);
  const album = albums.find(
    (a) => a.slug === params.slug || a.id === params.slug
  );

  if (!album || album.published === false) {
    return {
      title: "Album Not Found | Photography Showcase",
    };
  }

  const allPhotos = readJsonFile<PhotoItem[]>("photography.json", []);
  const albumPhotoIds = new Set(album.photoIds || []);
  const albumPhotos = allPhotos.filter(
    (photo) =>
      (albumPhotoIds.has(photo.id) || photo.albumId === album.id) &&
      photo.published !== false
  );

  if (albumPhotos.length === 0) {
    return {
      title: "Album Not Found | Photography Showcase",
    };
  }

  const coverImage =
    (albumPhotos.length === 1 ? albumPhotos[0]?.image : album.coverImage) ||
    albumPhotos[0]?.image ||
    album.coverImage;

  const title = `${album.title_vi ? `${album.title_vi} (${album.title})` : album.title} | Photography Album`;
  const description =
    album.description_vi ||
    album.description ||
    `Curated photography collection: ${album.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: coverImage ? [coverImage] : [],
    },
  };
}

export default function AlbumPage({ params }: AlbumPageProps) {
  const albums = readJsonFile<PhotoAlbum[]>("photography-albums.json", []);
  const album = albums.find(
    (a) => (a.slug === params.slug || a.id === params.slug) && a.published !== false
  );

  if (!album) {
    notFound();
  }

  const allPhotos = readJsonFile<PhotoItem[]>("photography.json", []);
  const albumPhotoIds = new Set(album.photoIds || []);

  // Filter photos in this album and sort
  const albumPhotos = allPhotos
    .filter(
      (photo) =>
        (albumPhotoIds.has(photo.id) || photo.albumId === album.id) &&
        photo.published !== false
    )
    .sort((a, b) => {
      // Priority: Featured photos first!
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Prioritize order in album.photoIds if available
      const idxA = album.photoIds ? album.photoIds.indexOf(a.id) : -1;
      const idxB = album.photoIds ? album.photoIds.indexOf(b.id) : -1;
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });

  // Requirement: Những album không có hình thì không show lên bên user
  if (albumPhotos.length === 0) {
    notFound();
  }

  // Requirement: Nếu chỉ có 1 hình trong album thì hình đó sẽ tự là bìa cho album
  const resolvedCoverImage =
    (albumPhotos.length === 1 ? albumPhotos[0]?.image : album.coverImage) ||
    albumPhotos[0]?.image ||
    album.coverImage;

  const resolvedCoverPhotoId =
    (albumPhotos.length === 1 ? albumPhotos[0]?.id : album.coverPhotoId) ||
    albumPhotos[0]?.id ||
    album.coverPhotoId;

  const resolvedAlbum: PhotoAlbum = {
    ...album,
    coverImage: resolvedCoverImage,
    coverPhotoId: resolvedCoverPhotoId,
    photoIds: Array.from(
      new Set([...(album.photoIds || []), ...albumPhotos.map((p) => p.id)])
    ),
  };

  // Other albums must also have at least 1 photo and be published
  const otherAlbums = albums
    .filter((a) => a.id !== album.id && a.published !== false)
    .map((a) => {
      const aIds = new Set(a.photoIds || []);
      const aPhotos = allPhotos.filter(
        (p) => (aIds.has(p.id) || p.albumId === a.id) && p.published !== false
      );
      const cover =
        (aPhotos.length === 1 ? aPhotos[0]?.image : a.coverImage) ||
        aPhotos[0]?.image ||
        a.coverImage;
      return {
        ...a,
        coverImage: cover,
        photoIds: Array.from(new Set([...(a.photoIds || []), ...aPhotos.map((p) => p.id)])),
        _count: aPhotos.length,
      };
    })
    .filter((a) => a._count > 0)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    })
    .map(({ _count, ...rest }) => rest as PhotoAlbum);

  return (
    <AlbumDetailView
      album={resolvedAlbum}
      photos={albumPhotos}
      otherAlbums={otherAlbums}
    />
  );
}
