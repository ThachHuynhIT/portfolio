import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getPostBySlug } from "@/lib/blog";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/blog/[slug] — Get full blog post (with content)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

/**
 * PUT /api/admin/blog/[slug] — Update a blog post
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const { slug } = await params;

    const existing = await db.cmsBlogPost.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
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

    const frontmatter: Record<string, unknown> = {
      title: title || "",
      excerpt: excerpt || "",
      date: date || new Date().toISOString().split("T")[0],
      category: category || "Uncategorized",
      tags: tags || [],
      readTime: readTime || "5 min read",
    };
    if (title_vi?.trim()) frontmatter.title_vi = title_vi.trim();
    if (excerpt_vi?.trim()) frontmatter.excerpt_vi = excerpt_vi.trim();
    if (content_vi?.trim()) frontmatter.content_vi = content_vi.trim();

    await db.cmsBlogPost.update({
      where: { slug },
      data: {
        title: title || "",
        titleVi: title_vi?.trim() || null,
        excerpt: excerpt || "",
        excerptVi: excerpt_vi?.trim() || null,
        contentVi: content_vi?.trim() || null,
        date: date || new Date().toISOString().split("T")[0],
        category: category || "Uncategorized",
        tags: tags || [],
        readTime: readTime || "5 min read",
        content: content || "",
      },
    });

    revalidateTag("blog");
    return NextResponse.json({ slug, ...frontmatter });
  } catch {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog/[slug] — Delete a blog post
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const { slug } = await params;

    const existing = await db.cmsBlogPost.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await db.cmsBlogPost.delete({ where: { slug } });
    revalidateTag("blog");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
