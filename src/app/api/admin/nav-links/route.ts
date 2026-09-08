import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { NavLink } from "@/lib/types";

const FILE = "nav-links.json";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(readJsonFile<NavLink[]>(FILE, []));
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    const items = readJsonFile<NavLink[]>(FILE, []);
    const newItem: NavLink = { id: generateId("nav"), ...body };
    items.push(newItem);
    writeJsonFile(FILE, items);
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
      const itemsWithOrder: NavLink[] = body.items.map((item: NavLink, idx: number) => ({
        ...item,
        order: idx,
      }));
      writeJsonFile(FILE, itemsWithOrder);
      return NextResponse.json(itemsWithOrder);
    }

    // 2. Single item update
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const items = readJsonFile<NavLink[]>(FILE, []);
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
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const items = readJsonFile<NavLink[]>(FILE, []);
    const filtered = items.filter((i) => i.id !== id);
    if (filtered.length === items.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    writeJsonFile(FILE, filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
