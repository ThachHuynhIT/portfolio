import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { listPhotos, createPhoto, updatePhoto, deletePhoto } from "@/lib/content/photography";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(await listPhotos());
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    const newPhoto = await createPhoto(body);
    revalidateTag("photography");
    return NextResponse.json(newPhoto, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to create photo item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = await updatePhoto(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    revalidateTag("photography");
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to update photo item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deleted = await deletePhoto(id);
    if (!deleted) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    revalidateTag("photography");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to delete photo item" }, { status: 500 });
  }
}
