/**
 * One-time migration: content/data/*.json + content/blog/*.mdx -> Postgres (Cms* tables).
 *
 * Run once, locally, against the real DATABASE_URL:
 *   npx tsx scripts/migrate-json-to-db.ts
 *
 * Idempotent-ish: uses upsert-by-id for most domains so re-running after a
 * partial failure won't duplicate rows, EXCEPT couple.json's child sections
 * (which have no stable natural id in the source data prior to this script
 * assigning one) — those use deleteMany-then-create per section, so re-runs
 * are still safe, just re-derive from the JSON each time.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import "dotenv/config";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "content/data");
const BLOG_DIR = path.join(ROOT, "content/blog");

function readJson<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

async function main() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  if (connectionString.includes("sslmode=require") && !connectionString.includes("uselibpqcompat")) {
    const sep = connectionString.includes("?") ? "&" : "?";
    connectionString = `${connectionString}${sep}uselibpqcompat=true`;
  }
  const pool = new Pool({ connectionString });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });

  const summary: Record<string, number> = {};

  // -------------------------------------------------------------------
  // Skills
  // -------------------------------------------------------------------
  const skills = readJson<any[]>("skills.json", []);
  for (const s of skills) {
    await db.cmsSkill.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        icon: s.icon,
        category: s.category,
        level: s.level ?? 0,
        published: s.published !== false,
      },
      update: {
        name: s.name,
        icon: s.icon,
        category: s.category,
        level: s.level ?? 0,
        published: s.published !== false,
      },
    });
  }
  summary.skills = skills.length;

  // -------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------
  const projects = readJson<any[]>("projects.json", []);
  for (const p of projects) {
    const data = {
      title: p.title,
      description: p.description,
      longDescription: p.longDescription,
      titleVi: p.title_vi,
      descriptionVi: p.description_vi,
      longDescriptionVi: p.longDescription_vi,
      image: p.image,
      tags: p.tags ?? [],
      liveUrl: p.liveUrl,
      githubUrl: p.githubUrl,
      featured: Boolean(p.featured),
      published: p.published !== false,
    };
    await db.cmsProject.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }
  summary.projects = projects.length;

  // -------------------------------------------------------------------
  // Social links
  // -------------------------------------------------------------------
  const socialLinks = readJson<any[]>("social-links.json", []);
  for (const s of socialLinks) {
    const data = { name: s.name, url: s.url, icon: s.icon, published: s.published !== false };
    await db.cmsSocialLink.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }
  summary.socialLinks = socialLinks.length;

  // -------------------------------------------------------------------
  // Nav links (+ nested children as a self-relation)
  // -------------------------------------------------------------------
  const navLinks = readJson<any[]>("nav-links.json", []);
  let navChildCount = 0;
  for (const n of navLinks) {
    const data = {
      label: n.label,
      labelVi: n.label_vi,
      href: n.href,
      order: n.order ?? 0,
      published: n.published !== false,
      parentId: null as string | null,
    };
    await db.cmsNavLink.upsert({ where: { id: n.id }, create: { id: n.id, ...data }, update: data });

    for (const child of n.children ?? []) {
      const childData = {
        label: child.label,
        labelVi: child.label_vi,
        href: child.href,
        order: child.order ?? 0,
        published: child.published !== false,
        parentId: n.id,
      };
      await db.cmsNavLink.upsert({
        where: { id: child.id },
        create: { id: child.id, ...childData },
        update: childData,
      });
      navChildCount++;
    }
  }
  summary.navLinks = navLinks.length;
  summary.navSubLinks = navChildCount;

  // -------------------------------------------------------------------
  // Photography: albums first, then photos (photo.albumId already points
  // at the right album id in the source JSON, no reconciliation needed).
  // -------------------------------------------------------------------
  const albums = readJson<any[]>("photography-albums.json", []);
  for (const a of albums) {
    const data = {
      title: a.title,
      titleVi: a.title_vi,
      slug: a.slug,
      description: a.description,
      descriptionVi: a.description_vi,
      coverImage: a.coverImage ?? "",
      coverPhotoId: a.coverPhotoId ?? null,
      order: a.order ?? 0,
      featured: Boolean(a.featured),
      published: a.published !== false,
    };
    await db.cmsPhotoAlbum.upsert({ where: { id: a.id }, create: { id: a.id, ...data }, update: data });
  }
  summary.photoAlbums = albums.length;

  const albumIds = new Set(albums.map((a) => a.id));
  const photos = readJson<any[]>("photography.json", []);
  for (const p of photos) {
    const data = {
      title: p.title,
      titleVi: p.title_vi,
      description: p.description,
      descriptionVi: p.description_vi,
      location: p.location,
      locationVi: p.location_vi,
      category: p.category,
      tags: p.tags ?? [],
      image: p.image,
      beforeImage: p.beforeImage,
      mediaType: p.mediaType ?? "image",
      videoUrl: p.videoUrl,
      aspectRatio: p.aspectRatio ?? "landscape",
      featured: Boolean(p.featured),
      published: p.published !== false,
      date: p.date,
      camera: p.camera ?? undefined,
      editing: p.editing ?? undefined,
      order: p.order ?? 0,
      albumId: p.albumId && albumIds.has(p.albumId) ? p.albumId : null,
    };
    await db.cmsPhoto.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
  }
  summary.photos = photos.length;

  // -------------------------------------------------------------------
  // Couple / Memories (singleton info + 7 child sections)
  // -------------------------------------------------------------------
  const couple = readJson<any>("couple.json", null);
  if (couple) {
    await db.cmsCoupleInfo.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        person1: couple.person1,
        person2: couple.person2,
        anniversary: couple.anniversary,
        footerQuote: couple.footerQuote,
      },
      update: {
        person1: couple.person1,
        person2: couple.person2,
        anniversary: couple.anniversary,
        footerQuote: couple.footerQuote,
      },
    });

    const idOf = (item: any) => item.id || crypto.randomUUID();

    await db.cmsCoupleBirthday.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCoupleBirthday.createMany({
      data: (couple.birthdays ?? []).map((b: any, i: number) => ({
        id: idOf(b),
        coupleInfoId: "singleton",
        name: b.name,
        date: b.date,
        emoji: b.emoji,
        zodiac: b.zodiac,
        published: b.published !== false,
        order: i,
      })),
    });

    await db.cmsCoupleSpecialDate.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCoupleSpecialDate.createMany({
      data: (couple.specialDates ?? []).map((d: any, i: number) => ({
        id: idOf(d),
        coupleInfoId: "singleton",
        name: d.name,
        date: d.date,
        emoji: d.emoji,
        published: d.published !== false,
        order: i,
      })),
    });

    await db.cmsCoupleMemory.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCoupleMemory.createMany({
      data: (couple.memories ?? []).map((m: any, i: number) => ({
        id: idOf(m),
        coupleInfoId: "singleton",
        date: m.date,
        title: m.title,
        description: m.description,
        emoji: m.emoji,
        image: m.image,
        published: m.published !== false,
        order: i,
      })),
    });

    await db.cmsCouplePhoto.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCouplePhoto.createMany({
      data: (couple.photos ?? []).map((p: any, i: number) => ({
        id: idOf(p),
        coupleInfoId: "singleton",
        title: p.title,
        description: p.description,
        image: p.image,
        date: p.date,
        location: p.location,
        category: p.category,
        featured: Boolean(p.featured),
        published: p.published !== false,
        order: i,
      })),
    });

    await db.cmsCoupleBucketItem.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCoupleBucketItem.createMany({
      data: (couple.bucketList ?? []).map((b: any, i: number) => ({
        id: idOf(b),
        coupleInfoId: "singleton",
        text: b.text,
        emoji: b.emoji,
        done: Boolean(b.done),
        published: b.published !== false,
        order: i,
      })),
    });

    await db.cmsCoupleLoveLetter.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCoupleLoveLetter.createMany({
      data: (couple.loveLetters ?? []).map((l: any, i: number) => ({
        id: idOf(l),
        coupleInfoId: "singleton",
        from: l.from,
        content: l.content,
        date: l.date,
        published: l.published !== false,
        order: i,
      })),
    });

    await db.cmsCoupleFavorite.deleteMany({ where: { coupleInfoId: "singleton" } });
    await db.cmsCoupleFavorite.createMany({
      data: (couple.favorites ?? []).map((f: any, i: number) => ({
        id: idOf(f),
        coupleInfoId: "singleton",
        category: f.category,
        title: f.title,
        description: f.description,
        emoji: f.emoji,
        published: f.published !== false,
        order: i,
      })),
    });

    summary.coupleBirthdays = (couple.birthdays ?? []).length;
    summary.coupleSpecialDates = (couple.specialDates ?? []).length;
    summary.coupleMemories = (couple.memories ?? []).length;
    summary.couplePhotos = (couple.photos ?? []).length;
    summary.coupleBucketItems = (couple.bucketList ?? []).length;
    summary.coupleLoveLetters = (couple.loveLetters ?? []).length;
    summary.coupleFavorites = (couple.favorites ?? []).length;
  }

  // -------------------------------------------------------------------
  // Site config (singleton)
  // -------------------------------------------------------------------
  const siteConfig = readJson<any>("site-config.json", null);
  if (siteConfig) {
    const data = {
      name: siteConfig.name,
      title: siteConfig.title,
      titleVi: siteConfig.title_vi,
      description: siteConfig.description,
      descriptionVi: siteConfig.description_vi,
      url: siteConfig.url,
      ogImage: siteConfig.ogImage,
      authorName: siteConfig.author?.name ?? "",
      authorTitle: siteConfig.author?.title ?? "",
      authorTitleVi: siteConfig.author?.title_vi,
      authorBio: siteConfig.author?.bio ?? "",
      authorBioVi: siteConfig.author?.bio_vi,
      authorAvatar: siteConfig.author?.avatar ?? "",
      authorEmail: siteConfig.author?.email ?? "",
      authorLocation: siteConfig.author?.location ?? "",
      authorLocationVi: siteConfig.author?.location_vi,
    };
    await db.cmsSiteConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...data },
      update: data,
    });
    summary.siteConfig = 1;
  }

  // -------------------------------------------------------------------
  // Media registry
  // -------------------------------------------------------------------
  const mediaAssets = readJson<any[]>("media-registry.json", []);
  for (const m of mediaAssets) {
    const data = {
      filename: m.filename,
      url: m.url,
      secureUrl: m.secureUrl,
      category: m.category,
      subType: m.subType,
      format: m.format,
      bytes: m.bytes ?? 0,
      width: m.width,
      height: m.height,
      duration: m.duration,
      resourceType: m.resourceType,
      tags: m.tags ?? [],
    };
    await db.cmsMediaAsset.upsert({
      where: { publicId: m.publicId },
      create: { id: m.id, publicId: m.publicId, ...data },
      update: data,
    });
  }
  summary.mediaAssets = mediaAssets.length;

  // -------------------------------------------------------------------
  // Blog posts (MDX frontmatter + body)
  // -------------------------------------------------------------------
  let blogCount = 0;
  if (fs.existsSync(BLOG_DIR)) {
    const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
    for (const file of files) {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      const post = {
        title: String(data.title || ""),
        titleVi: data.title_vi ? String(data.title_vi) : null,
        excerpt: String(data.excerpt || ""),
        excerptVi: data.excerpt_vi ? String(data.excerpt_vi) : null,
        contentVi: data.content_vi ? String(data.content_vi) : null,
        date: String(data.date || ""),
        category: String(data.category || ""),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        readTime: String(data.readTime || ""),
        content,
      };
      await db.cmsBlogPost.upsert({
        where: { slug },
        create: { id: slug, slug, ...post },
        update: post,
      });
      blogCount++;
    }
  }
  summary.blogPosts = blogCount;

  console.log("Migration complete:");
  console.table(summary);

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
