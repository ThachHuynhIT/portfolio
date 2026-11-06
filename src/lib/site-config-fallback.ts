// Pure (no Prisma runtime, no DB) site-config defaults and row mapper, shared
// by the content layer (src/lib/content/site-config.ts) and the root layout's
// DB-outage fallback. Only *types* come from the generated Prisma client.

import type { CmsSiteConfig } from "@/generated/prisma";
import type { SiteConfig, SiteSectionsContent } from "@/lib/types";

export type SiteConfigRow = Omit<CmsSiteConfig, "id" | "updatedAt">;

/** Defaults used to create the singleton row and as the DB-outage fallback. */
export const DEFAULT_SITE_CONFIG_ROW: Readonly<SiteConfigRow> = {
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

export function toSiteConfig(row: SiteConfigRow): SiteConfig {
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

/**
 * Typed fallback for when the DB is unreachable (e.g. build without a DB).
 * Returns a fresh object each call. Callers must apply it *outside* the
 * cached reader so an outage is never cached as a successful response.
 */
export function getFallbackSiteConfig(): SiteConfig {
  return toSiteConfig({ ...DEFAULT_SITE_CONFIG_ROW, sectionsContent: {} });
}
