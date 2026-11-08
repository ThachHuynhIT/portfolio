import type { CmsBlogPost } from "@/generated/prisma";
import type { BlogPost, BlogPostListItem } from "@/lib/types";

/**
 * Pure helpers for blog list payloads. No DB access here so they can be unit
 * tested and shared by the cached public reads and the admin list.
 */

/** Prisma `select` whitelist for list queries — deliberately excludes both MDX bodies. */
export const blogListSelect = {
  slug: true,
  title: true,
  titleVi: true,
  excerpt: true,
  excerptVi: true,
  date: true,
  category: true,
  tags: true,
  readTime: true,
} as const satisfies Partial<Record<keyof CmsBlogPost, true>>;

export type BlogListRow = Pick<CmsBlogPost, keyof typeof blogListSelect>;

/** Explicit field-by-field mapping (no spread) so extra row fields such as bodies never leak. */
export function toBlogListItem(row: BlogListRow): BlogPostListItem {
  return {
    slug: row.slug,
    title: row.title,
    title_vi: row.titleVi ?? undefined,
    excerpt: row.excerpt,
    excerpt_vi: row.excerptVi ?? undefined,
    date: row.date,
    category: row.category,
    tags: row.tags,
    readTime: row.readTime,
  };
}

/** Metadata the post page's client view needs: no MDX bodies, only whether a VI body exists. */
export type BlogPostViewMeta = BlogPostListItem & { hasVi: boolean };

export function toBlogPostViewMeta(post: BlogPost): BlogPostViewMeta {
  return {
    slug: post.slug,
    title: post.title,
    title_vi: post.title_vi,
    excerpt: post.excerpt,
    excerpt_vi: post.excerpt_vi,
    date: post.date,
    category: post.category,
    tags: post.tags,
    readTime: post.readTime,
    hasVi: Boolean(post.content_vi?.trim()),
  };
}

function dateValue(date: string): number {
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/** Newest first; unparseable dates sink to the end instead of throwing or scrambling the order. */
export function comparePostDates(a: Pick<BlogPostListItem, "date">, b: Pick<BlogPostListItem, "date">): number {
  const ta = dateValue(a.date);
  const tb = dateValue(b.date);
  if (ta === tb) return 0;
  return ta > tb ? -1 : 1;
}

export function getCategories(items: readonly BlogPostListItem[]): string[] {
  return Array.from(new Set(items.map((item) => item.category)));
}

export function getTags(items: readonly BlogPostListItem[]): string[] {
  return Array.from(new Set(items.flatMap((item) => item.tags)));
}

/** URL-safe slug, same normalisation the admin create route has always applied. */
export function toSafeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
