import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { getPostBySlug } from "@/lib/blog";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/blog/[slug] — Get full blog post (with content)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

/**
 * PUT /api/admin/blog/[slug] — Update a blog post
 */
export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { slug } = await params;
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
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

    const fileContent = matter.stringify(content || "", frontmatter);
    fs.writeFileSync(filePath, fileContent, "utf-8");

    return NextResponse.json({ slug, ...frontmatter });
  } catch {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog/[slug] — Delete a blog post
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { slug } = await params;
    const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
