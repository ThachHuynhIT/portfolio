import { getPublishedPhotos, getPublishedAlbums } from "@/lib/content/photography";
import PhotographyGallery from "@/components/photography/PhotographyGallery";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Photography & Media Gallery",
  description:
    "Explore curated photography, cinematic color grading, and creative post-processing artworks across diverse visual perspectives.",
  path: "/photography",
});

export const dynamic = "force-dynamic";

export default async function PhotographyPage() {
  const [photos, allAlbums] = await Promise.all([getPublishedPhotos(), getPublishedAlbums()]);

  // Only show albums that actually have at least one *published* photo — the
  // photoIds relation is always accurate now (a real FK, not a hand-synced
  // array), so no manual cover/photoIds reconciliation is needed here anymore,
  // just re-checking against the published-only photo list.
  const albumIdsWithPublishedPhotos = new Set(photos.map((p) => p.albumId).filter(Boolean));
  const albums = allAlbums.filter((a) => albumIdsWithPublishedPhotos.has(a.id));

  return <PhotographyGallery initialPhotos={photos} initialAlbums={albums} />;
}
