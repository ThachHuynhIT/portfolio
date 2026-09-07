import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { PhotoItem } from "@/lib/types";

const FILE = "photography.json";

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = readJsonFile<PhotoItem[]>(FILE, []);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const photos = readJsonFile<PhotoItem[]>(FILE, []);
    const newPhoto: PhotoItem = {
      id: generateId("photo"),
      order: photos.length + 1,
      ...body,
    };
    photos.push(newPhoto);
    writeJsonFile(FILE, photos);
    return NextResponse.json(newPhoto, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to create photo item" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const photos = readJsonFile<PhotoItem[]>(FILE, []);
    const index = photos.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    photos[index] = { ...photos[index], ...updates };
    writeJsonFile(FILE, photos);
    return NextResponse.json(photos[index]);
  } catch (error) {
    console.error("[PUT /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to update photo item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const photos = readJsonFile<PhotoItem[]>(FILE, []);
    const filtered = photos.filter((p) => p.id !== id);
    if (filtered.length === photos.length) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    writeJsonFile(FILE, filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/photography] Error:", error);
    return NextResponse.json({ error: "Failed to delete photo item" }, { status: 500 });
  }
}
