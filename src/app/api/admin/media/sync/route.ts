import { NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { syncAssetsFromCloudinary } from "@/lib/media-service";

export async function POST() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
