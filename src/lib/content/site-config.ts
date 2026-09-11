import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { SiteConfig, SiteSectionsContent } from "@/lib/types";
import type { CmsSiteConfig, Prisma } from "@/generated/prisma";

const SINGLETON_ID = "singleton";

const DEFAULT_CONFIG: Omit<CmsSiteConfig, "id" | "updatedAt"> = {
  name: "ThachHuynh's Portfolio",
  title: "ThachHuynh | Front-end Web Developer",
  titleVi: "ThachHuynh | Lập trình viên Front-end",
  description:
    "Front-end Developer with 3 years of experience building production React and TypeScript applications, including real-time UIs for industrial control systems.",
  descriptionVi:
    "Lập trình viên Front-end với 3 năm kinh nghiệm xây dựng ứng dụng React và TypeScript trong môi trường sản xuất, bao gồm giao diện thời gian thực cho hệ thống điều khiển công nghiệp.",
  url: "https://portfolio-thach.vercel.app/",
  ogImage: "/og.jpg",
  authorName: "Thach Huynh",
  authorTitle: "Front-end Web Developer",
  authorTitleVi: "Lập trình viên Front-end",
  authorBio: "Front-end Developer building fast, reliable React & TypeScript apps.",
  authorBioVi:
    "Lập trình viên Front-end xây dựng ứng dụng React & TypeScript nhanh, ổn định.",
  authorAvatar: "/avatar.jpg",
  authorEmail: "thachhuynhit.ut@gmail.com",
  authorLocation: "Go Vap, Ho Chi Minh City, Vietnam",
  authorLocationVi: "Phường Gò Vấp, Thành phố Hồ Chí Minh, Việt Nam",
  resumeUrl: null,
  sectionsContent: {},
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
    resumeUrl: row.resumeUrl,
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
    sectionsContent: (row.sectionsContent as SiteSectionsContent | null) ?? {},
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await db.cmsSiteConfig.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: {
      id: SINGLETON_ID,
      ...DEFAULT_CONFIG,
      sectionsContent: DEFAULT_CONFIG.sectionsContent as Prisma.InputJsonValue,
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
