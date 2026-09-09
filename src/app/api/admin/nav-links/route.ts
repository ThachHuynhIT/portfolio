import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { listNavLinks, createNavLink, updateNavLink, reorderNavLinks, deleteNavLink } from "@/lib/content/nav-links";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(await listNavLinks());
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    const newItem = await createNavLink(body);
    revalidateTag("nav-links");
    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();

    // 1. Bulk reordering support
    if (Array.isArray(body.items)) {
      const reordered = await reorderNavLinks(body.items);
      revalidateTag("nav-links");
      return NextResponse.json(reordered);
    }

    // 2. Single item update
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updated = await updateNavLink(id, updates);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    revalidateTag("nav-links");
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const deleted = await deleteNavLink(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    revalidateTag("nav-links");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
