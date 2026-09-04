import { Metadata } from "next";
import { readJsonFile } from "@/lib/data-manager";
import type { PhotoItem } from "@/lib/types";
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

export const revalidate = 60; // ISR

export default function PhotographyPage() {
  const photos = readJsonFile<PhotoItem[]>("photography.json", []);

  // Sort by order or date
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return <PhotographyGallery initialPhotos={sortedPhotos} />;
}
