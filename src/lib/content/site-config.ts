import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { SiteConfig } from "@/lib/types";
import type { CmsSiteConfig } from "@/generated/prisma";

const SINGLETON_ID = "singleton";

const DEFAULT_CONFIG: Omit<CmsSiteConfig, "id" | "updatedAt"> = {
  name: "ThachHuynh's Portfolio",
  title: "Thach Huynh | Creative Web Developer",
  titleVi: null,
  description: "A passionate web developer crafting immersive digital experiences with cutting-edge technologies.",
  descriptionVi: null,
  url: "https://johndoe.dev",
  ogImage: "/og.jpg",
  authorName: "Thach Huynh",
  authorTitle: "Creative Web Developer",
  authorTitleVi: null,
  authorBio: "",
  authorBioVi: null,
  authorAvatar: "/avatar.jpg",
  authorEmail: "thachhuynhit.ut@gmail.com",
  authorLocation: "San Francisco, CA",
  authorLocationVi: null,
};

function toSiteConfig(row: CmsSiteConfig): SiteConfig {
  return {
    name: row.name,
    title: row.title,
    title_vi: row.titleVi ?? undefined,
    description: row.description,
    description_vi: row.descriptionVi ?? undefined,
    url: row.url,
    ogImage: row.ogImage,
    author: {
      name: row.authorName,
      title: row.authorTitle,
      title_vi: row.authorTitleVi ?? undefined,
      bio: row.authorBio,
      bio_vi: row.authorBioVi ?? undefined,
      avatar: row.authorAvatar,
      email: row.authorEmail,
      location: row.authorLocation,
      location_vi: row.authorLocationVi ?? undefined,
    },
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await db.cmsSiteConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, ...DEFAULT_CONFIG },
  });
  return toSiteConfig(row);
}

// unstable_cache persists the result across requests (Next's Data Cache);
// wrapping it in React's cache() additionally dedupes concurrent calls
// *within* the same request/render — root layout's generateMetadata() and
// its component body both call this, and without the outer cache() a
// cache-cold request would run getSiteConfig()'s upsert twice.
export const getPublishedSiteConfig = cache(
  unstable_cache(getSiteConfig, ["published-site-config"], {
    tags: ["site-config"],
  })
);

/** Full blind overwrite, matching the original PUT's no-merge semantics. */
export async function replaceSiteConfig(config: SiteConfig): Promise<SiteConfig> {
  const row = await db.cmsSiteConfig.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      name: config.name,
      title: config.title,
      titleVi: config.title_vi,
      description: config.description,
      descriptionVi: config.description_vi,
      url: config.url,
      ogImage: config.ogImage,
      authorName: config.author.name,
      authorTitle: config.author.title,
      authorTitleVi: config.author.title_vi,
      authorBio: config.author.bio,
      authorBioVi: config.author.bio_vi,
      authorAvatar: config.author.avatar,
      authorEmail: config.author.email,
      authorLocation: config.author.location,
      authorLocationVi: config.author.location_vi,
    },
    update: {
      name: config.name,
      title: config.title,
      titleVi: config.title_vi,
      description: config.description,
      descriptionVi: config.description_vi,
      url: config.url,
      ogImage: config.ogImage,
      authorName: config.author.name,
      authorTitle: config.author.title,
      authorTitleVi: config.author.title_vi,
      authorBio: config.author.bio,
      authorBioVi: config.author.bio_vi,
      authorAvatar: config.author.avatar,
      authorEmail: config.author.email,
      authorLocation: config.author.location,
      authorLocationVi: config.author.location_vi,
    },
  });
  return toSiteConfig(row);
}
