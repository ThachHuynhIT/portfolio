import { unstable_cache } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { BlogPost, BlogPostListItem } from "@/lib/types";
import type { CmsBlogPost } from "@/generated/prisma";
import {
  blogListSelect,
  comparePostDates,
  getCategories,
  getTags,
  toBlogListItem,
  toSafeSlug,
} from "@/lib/blog-list";
import { validateMdxSource } from "@/lib/mdx-policy";

function toBlogPost(row: CmsBlogPost): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    title_vi: row.titleVi ?? undefined,
    excerpt: row.excerpt,
    excerpt_vi: row.excerptVi ?? undefined,
    content_vi: row.contentVi ?? undefined,
    date: row.date,
    category: row.category,
    tags: row.tags,
    readTime: row.readTime,
    content: row.content,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function querySummaries(): Promise<BlogPostListItem[]> {
  const rows = await db.cmsBlogPost.findMany({ select: blogListSelect });
  return rows.map(toBlogListItem).sort(comparePostDates);
}

async function queryPost(slug: string): Promise<BlogPost | null> {
  const row = await db.cmsBlogPost.findUnique({ where: { slug } });
  return row ? toBlogPost(row) : null;
}

/** Public, cached: metadata of every post (no EN/VI body), newest first. */
export const getPostSummaries = unstable_cache(querySummaries, ["blog-summaries-v1"], { tags: ["blog"] });

/** Public, cached per slug (the slug is a cache-function argument, so it is part of the key). */
export const getPostBySlug = unstable_cache(queryPost, ["blog-post-v1"], { tags: ["blog"] });

/** Admin, uncached: list metadata without bodies. */
export async function listPostSummaries(): Promise<BlogPostListItem[]> {
  return querySummaries();
}

/** Admin editor, uncached: full post including both bodies. */
export async function findPost(slug: string): Promise<BlogPost | null> {
  return queryPost(slug);
}

export async function getAllCategories(): Promise<string[]> {
  return getCategories(await getPostSummaries());
}

export async function getAllTags(): Promise<string[]> {
  return getTags(await getPostSummaries());
}

export async function getPostsByCategory(category: string): Promise<BlogPostListItem[]> {
  const wanted = category.toLowerCase();
  return (await getPostSummaries()).filter((post) => post.category.toLowerCase() === wanted);
}

export async function getPostsByTag(tag: string): Promise<BlogPostListItem[]> {
  const wanted = tag.toLowerCase();
  return (await getPostSummaries()).filter((post) => post.tags.some((t) => t.toLowerCase() === wanted));
}

// ---------------------------------------------------------------------------
// Writes (admin). Callers must authenticate first and revalidateTag("blog")
// only after a successful write.
// ---------------------------------------------------------------------------

const optionalText = z.string().optional().nullable();

/** Admin request body for create/update. Loose on purpose: mirrors the editor form. */
export const blogPostInputSchema = z.object({
  slug: optionalText,
  title: optionalText,
  title_vi: optionalText,
  excerpt: optionalText,
  excerpt_vi: optionalText,
  content: optionalText,
  content_vi: optionalText,
  date: optionalText,
  category: optionalText,
  tags: z.array(z.string()).optional().nullable(),
  readTime: optionalText,
});

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toWriteData(input: BlogPostInput) {
  return {
    title: input.title || "",
    titleVi: trimmedOrNull(input.title_vi),
    excerpt: input.excerpt || "",
    excerptVi: trimmedOrNull(input.excerpt_vi),
    contentVi: trimmedOrNull(input.content_vi),
    date: input.date || today(),
    category: input.category || "Uncategorized",
    tags: input.tags || [],
    readTime: input.readTime || "5 min read",
    content: input.content || "",
  };
}

/** Rejects (MdxPolicyError) if either body breaks the MDX policy. */
async function assertBodiesAllowed(data: { content: string; contentVi: string | null }): Promise<void> {
  await validateMdxSource(data.content);
  if (data.contentVi) await validateMdxSource(data.contentVi);
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export type CreatePostResult =
  | { status: "created"; post: BlogPostListItem }
  | { status: "conflict" }
  | { status: "invalid_slug" };

export async function createPost(input: BlogPostInput): Promise<CreatePostResult> {
  const slug = toSafeSlug(input.slug ?? "");
  if (!slug) return { status: "invalid_slug" };

  const data = toWriteData(input);
  await assertBodiesAllowed(data);

  const existing = await db.cmsBlogPost.findUnique({ where: { slug }, select: { slug: true } });
  if (existing) return { status: "conflict" };

  try {
    const row = await db.cmsBlogPost.create({ data: { id: slug, slug, ...data } });
    return { status: "created", post: toBlogListItem(row) };
  } catch (error) {
    if (isUniqueViolation(error)) return { status: "conflict" };
    throw error;
  }
}

/** Returns the updated post metadata, or null when the slug does not exist. */
export async function updatePost(slug: string, input: BlogPostInput): Promise<BlogPostListItem | null> {
  const data = toWriteData(input);
  await assertBodiesAllowed(data);

  const existing = await db.cmsBlogPost.findUnique({ where: { slug }, select: { slug: true } });
  if (!existing) return null;

  const row = await db.cmsBlogPost.update({ where: { slug }, data });
  return toBlogListItem(row);
}

/** Returns false when the slug does not exist. */
export async function deletePost(slug: string): Promise<boolean> {
  const existing = await db.cmsBlogPost.findUnique({ where: { slug }, select: { slug: true } });
  if (!existing) return false;
  await db.cmsBlogPost.delete({ where: { slug } });
  return true;
}
