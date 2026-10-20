import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { upsertWorkOverride } from "@/lib/content/couple";
import { workOverrideSchema } from "@/lib/couple-schedule-schema";

export async function POST(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const parsed = workOverrideSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  try {
    const saved = await upsertWorkOverride(parsed.data);
    revalidateTag("couple");
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[POST /api/admin/couple/work-overrides] Error:", error);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
}
