import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { blogPostInputSchema, deletePost, findPost, updatePost } from "@/lib/blog";
import { MdxPolicyError } from "@/lib/mdx-policy";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/admin/blog/[slug] — Get full blog post (with EN and VI content), uncached
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const { slug } = await params;
  const post = await findPost(slug);
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
    const parsed = blogPostInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const post = await updatePost(slug, parsed.data);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    revalidateTag("blog");
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof MdxPolicyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
    const deleted = await deletePost(slug);
    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    revalidateTag("blog");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
