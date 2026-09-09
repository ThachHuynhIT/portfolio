import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { readJsonFile, writeJsonFile, generateId } from "@/lib/data-manager";
import type { Skill } from "@/lib/types";

const FILE = "skills.json";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const data = readJsonFile<Skill[]>(FILE, []);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    const skills = readJsonFile<Skill[]>(FILE, []);
    const newSkill: Skill = { id: generateId("skill"), ...body };
    skills.push(newSkill);
    writeJsonFile(FILE, skills);
    return NextResponse.json(newSkill, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const skills = readJsonFile<Skill[]>(FILE, []);
    const index = skills.findIndex((s) => s.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    skills[index] = { ...skills[index], ...updates };
    writeJsonFile(FILE, skills);
    return NextResponse.json(skills[index]);
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

    const skills = readJsonFile<Skill[]>(FILE, []);
    const filtered = skills.filter((s) => s.id !== id);
    if (filtered.length === skills.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    writeJsonFile(FILE, filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
