import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { BlogPost } from "./types";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/**
 * Get all blog posts with frontmatter
 */
export function getAllPosts(): BlogPost[] {
  // Check if directory exists
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR);
  const posts = files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(".mdx", "");
      const filePath = path.join(BLOG_DIR, file);

      try {
        const fileContents = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContents);

        const postItem: BlogPost = {
          slug,
          title: String(data.title || ""),
          title_vi: data.title_vi ? String(data.title_vi) : undefined,
          excerpt: String(data.excerpt || ""),
          excerpt_vi: data.excerpt_vi ? String(data.excerpt_vi) : undefined,
          content_vi: data.content_vi ? String(data.content_vi) : undefined,
          date: String(data.date || ""),
          category: String(data.category || ""),
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          readTime: String(data.readTime || ""),
          content,
        };

        return postItem;
      } catch (error) {
        console.error(`Skipping malformed blog post "${file}":`, error);
        return null;
      }
    })
    .filter((post: BlogPost | null): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContents);

  const postItem: BlogPost = {
    slug,
    title: String(data.title || ""),
    title_vi: data.title_vi ? String(data.title_vi) : undefined,
    excerpt: String(data.excerpt || ""),
    excerpt_vi: data.excerpt_vi ? String(data.excerpt_vi) : undefined,
    content_vi: data.content_vi ? String(data.content_vi) : undefined,
    date: String(data.date || ""),
    category: String(data.category || ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readTime: String(data.readTime || ""),
    content,
  };

  return postItem;
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories);
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set(posts.flatMap((post) => post.tags));
  return Array.from(tags);
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) =>
    post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}
