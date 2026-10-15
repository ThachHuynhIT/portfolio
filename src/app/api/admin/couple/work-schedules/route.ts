import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getWorkSchedules, saveWorkSchedules } from "@/lib/content/couple";
import { workSchedulesBodySchema } from "@/lib/couple-schedule-schema";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  return NextResponse.json(await getWorkSchedules());
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const parsed = workSchedulesBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  try {
    const saved = await saveWorkSchedules(parsed.data.schedules);
    revalidateTag("couple");
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[PUT /api/admin/couple/work-schedules] Error:", error);
    return NextResponse.json({ error: "Failed to save schedules" }, { status: 500 });
  }
}
