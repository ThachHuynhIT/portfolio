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
      message: `Đã đồng bộ thành công ${result.added} tệp tin mới từ Cloudinary.`,
      added: result.added,
      total: result.total,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/media/sync] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Đồng bộ từ Cloudinary thất bại" },
      { status: 500 }
    );
  }
}
