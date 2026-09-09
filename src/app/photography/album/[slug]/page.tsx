import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPhotos, getPublishedAlbums } from "@/lib/content/photography";
import type { PhotoAlbum } from "@/lib/types";
import AlbumDetailView from "@/components/photography/AlbumDetailView";

interface AlbumPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const albums = await getPublishedAlbums();
  const album = albums.find((a) => a.slug === params.slug || a.id === params.slug);

  if (!album || album.photoIds.length === 0) {
    return { title: "Album Not Found | Photography Showcase" };
  }

  const title = `${album.title_vi ? `${album.title_vi} (${album.title})` : album.title} | Photography Album`;
  const description =
    album.description_vi || album.description || `Curated photography collection: ${album.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: album.coverImage ? [album.coverImage] : [],
    },
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const [albums, allPhotos] = await Promise.all([getPublishedAlbums(), getPublishedPhotos()]);

  const album = albums.find((a) => a.slug === params.slug || a.id === params.slug);
  if (!album) {
    notFound();
  }

  const albumPhotos = allPhotos
    .filter((p) => p.albumId === album.id)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  // Những album không có hình thì không show lên bên user
  if (albumPhotos.length === 0) {
    notFound();
  }

  // Other albums must also have at least 1 published photo
  const otherAlbums: PhotoAlbum[] = albums
    .filter((a) => a.id !== album.id && a.photoIds.length > 0)
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  return <AlbumDetailView album={album} photos={albumPhotos} otherAlbums={otherAlbums} />;
}
