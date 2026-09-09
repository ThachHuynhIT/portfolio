import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { listAlbums, createAlbum, updateAlbum, deleteAlbum } from "@/lib/content/photography";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(await listAlbums());
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await request.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newAlbum = await createAlbum(body);
    revalidateTag("photography");
    return NextResponse.json(newAlbum, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/photography/albums] Error:", error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const updated = await updateAlbum(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    revalidateTag("photography");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/admin/photography/albums] Error:", error);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const deleted = await deleteAlbum(id);
    if (!deleted) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    revalidateTag("photography");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/photography/albums] Error:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
