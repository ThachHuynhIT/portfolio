import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteWorkOverride } from "@/lib/content/couple";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const { id } = await params;
  const deleted = await deleteWorkOverride(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateTag("couple");
  return NextResponse.json({ success: true });
}
