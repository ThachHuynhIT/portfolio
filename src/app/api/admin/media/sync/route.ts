import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { syncAssetsFromCloudinary } from "@/lib/media-service";

export async function POST() {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const result = await syncAssetsFromCloudinary();
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.added} new files from Cloudinary.`,
      added: result.added,
      total: result.total,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/media/sync] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to sync from Cloudinary" },
      { status: 500 }
    );
  }
}
