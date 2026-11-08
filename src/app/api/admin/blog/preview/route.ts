import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { serialize } from "next-mdx-remote/serialize";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { mdxPolicyRemarkPlugins, validateMdxSource } from "@/lib/mdx-policy";

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await request.json();
    const content: string = typeof body?.content === "string" ? body.content : "";

    if (!content.trim()) {
      return NextResponse.json({ mdxSource: null });
    }

    // Same policy as admin writes and public render: reject before compiling.
    await validateMdxSource(content);

    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: mdxPolicyRemarkPlugins,
        rehypePlugins: [rehypeHighlight, rehypeSlug],
      },
    });

    return NextResponse.json({ mdxSource });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to compile MDX";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
