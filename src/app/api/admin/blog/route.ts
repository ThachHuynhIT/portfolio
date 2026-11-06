import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { blogPostInputSchema, createPost, listPostSummaries } from "@/lib/blog";
import { MdxPolicyError } from "@/lib/mdx-policy";

/**
 * GET /api/admin/blog — List all blog posts (metadata only, no EN/VI body)
 */
export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(await listPostSummaries());
}

/**
 * POST /api/admin/blog — Create a new blog post
 */
export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const parsed = blogPostInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const input = parsed.data;
    if (!input.slug || !input.title) {
      return NextResponse.json({ error: "Slug and title are required" }, { status: 400 });
    }

    const result = await createPost(input);
    if (result.status === "invalid_slug") {
      return NextResponse.json({ error: "Slug must contain letters or numbers" }, { status: 400 });
    }
    if (result.status === "conflict") {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    revalidateTag("blog");
    return NextResponse.json(result.post, { status: 201 });
  } catch (error) {
    if (error instanceof MdxPolicyError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
