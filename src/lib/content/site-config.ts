import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { SiteConfig } from "@/lib/types";
import type { Prisma } from "@/generated/prisma";
import { DEFAULT_SITE_CONFIG_ROW, toSiteConfig } from "@/lib/site-config-fallback";

const SINGLETON_ID = "singleton";

export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await db.cmsSiteConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: {
      id: SINGLETON_ID,
      ...DEFAULT_SITE_CONFIG_ROW,
      sectionsContent: DEFAULT_SITE_CONFIG_ROW.sectionsContent as Prisma.InputJsonValue,
    },
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
      resumeUrl: config.resumeUrl,
      authorName: config.author.name,
      authorTitle: config.author.title,
      authorTitleVi: config.author.title_vi,
      authorBio: config.author.bio,
      authorBioVi: config.author.bio_vi,
      authorAvatar: config.author.avatar,
      authorEmail: config.author.email,
      authorLocation: config.author.location,
      authorLocationVi: config.author.location_vi,
      sectionsContent: (config.sectionsContent ?? {}) as Prisma.InputJsonValue,
    },
    update: {
      name: config.name,
      title: config.title,
      titleVi: config.title_vi,
      description: config.description,
      descriptionVi: config.description_vi,
      url: config.url,
      ogImage: config.ogImage,
      resumeUrl: config.resumeUrl,
      authorName: config.author.name,
      authorTitle: config.author.title,
      authorTitleVi: config.author.title_vi,
      authorBio: config.author.bio,
      authorBioVi: config.author.bio_vi,
      authorAvatar: config.author.avatar,
      authorEmail: config.author.email,
      authorLocation: config.author.location,
      authorLocationVi: config.author.location_vi,
      sectionsContent: (config.sectionsContent ?? {}) as Prisma.InputJsonValue,
    },
  });
  return toSiteConfig(row);
}
