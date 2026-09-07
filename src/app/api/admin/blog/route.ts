import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { getAllPosts } from "@/lib/blog";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/**
 * GET /api/admin/blog — List all blog posts (frontmatter only)
 */
export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = getAllPosts().map(({ content: _content, ...meta }) => meta);
  return NextResponse.json(posts);
}

/**
 * POST /api/admin/blog — Create a new blog post
 */
export async function POST(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      slug,
      title,
      title_vi,
      excerpt,
      excerpt_vi,
      content_vi,
      date,
      category,
      tags,
      readTime,
      content,
    } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "Slug and title are required" }, { status: 400 });
    }

    // Ensure slug is URL-safe
    const safeSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const filePath = path.join(BLOG_DIR, `${safeSlug}.mdx`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    // Ensure blog directory exists
    if (!fs.existsSync(BLOG_DIR)) {
      fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    const frontmatter: Record<string, unknown> = {
      title,
      excerpt: excerpt || "",
      date: date || new Date().toISOString().split("T")[0],
      category: category || "Uncategorized",
      tags: tags || [],
      readTime: readTime || "5 min read",
    };

    if (title_vi?.trim()) frontmatter.title_vi = title_vi.trim();
    if (excerpt_vi?.trim()) frontmatter.excerpt_vi = excerpt_vi.trim();
    if (content_vi?.trim()) frontmatter.content_vi = content_vi.trim();

    const fileContent = matter.stringify(content || "", frontmatter);
    fs.writeFileSync(filePath, fileContent, "utf-8");

    return NextResponse.json({ slug: safeSlug, ...frontmatter }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
