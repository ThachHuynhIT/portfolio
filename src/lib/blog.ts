import { db } from "@/lib/db";
import type { BlogPost } from "@/lib/types";
import type { CmsBlogPost } from "@/generated/prisma";

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

/**
 * Get all blog posts with frontmatter
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  const rows = await db.cmsBlogPost.findMany();
  return rows.map(toBlogPost).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const row = await db.cmsBlogPost.findUnique({ where: { slug } });
  return row ? toBlogPost(row) : null;
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories);
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tags = new Set(posts.flatMap((post) => post.tags));
  return Array.from(tags);
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()));
}
