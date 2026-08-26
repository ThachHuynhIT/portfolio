import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { SocialLink } from "@/lib/types";

const FILE = "social-links.json";

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readJsonFile<SocialLink[]>(FILE, []));
}

export async function POST(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const items = readJsonFile<SocialLink[]>(FILE, []);
    const newItem: SocialLink = { id: generateId("social"), ...body };
    items.push(newItem);
    writeJsonFile(FILE, items);
    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const items = readJsonFile<SocialLink[]>(FILE, []);
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    items[index] = { ...items[index], ...updates };
    writeJsonFile(FILE, items);
    return NextResponse.json(items[index]);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const items = readJsonFile<SocialLink[]>(FILE, []);
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    writeJsonFile(FILE, filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
