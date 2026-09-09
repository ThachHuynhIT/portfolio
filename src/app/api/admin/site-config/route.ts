import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { getSiteConfig, replaceSiteConfig } from "@/lib/content/site-config";

export async function GET() {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const data = await getSiteConfig();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  try {
    const body = await request.json();
    await replaceSiteConfig(body);
    revalidateTag("site-config");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
