import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAllPosts } from "@/lib/blog";
import { db } from "@/lib/db";

/**
 * GET /api/admin/blog — List all blog posts (frontmatter only)
 */
export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const posts = (await getAllPosts()).map(({ content: _content, ...meta }) => meta);
  return NextResponse.json(posts);
}

/**
 * POST /api/admin/blog — Create a new blog post
 */
export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
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

    const existing = await db.cmsBlogPost.findUnique({ where: { slug: safeSlug } });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
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

    await db.cmsBlogPost.create({
      data: {
        id: safeSlug,
        slug: safeSlug,
        title,
        titleVi: title_vi?.trim() || undefined,
        excerpt: excerpt || "",
        excerptVi: excerpt_vi?.trim() || undefined,
        contentVi: content_vi?.trim() || undefined,
        date: date || new Date().toISOString().split("T")[0],
        category: category || "Uncategorized",
        tags: tags || [],
        readTime: readTime || "5 min read",
        content: content || "",
      },
    });

    revalidateTag("blog");
    return NextResponse.json({ slug: safeSlug, ...frontmatter }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
