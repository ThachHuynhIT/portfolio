import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { uploadAndRegisterMedia } from "@/lib/media-service";
import path from "path";

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isBefore = formData.get("isBefore") === "true";
    const subTypeInput = formData.get("subType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = (path.extname(file.name) || "").toLowerCase();
    const mimeType = file.type || "image/jpeg";
    const isVideo =
      mimeType.startsWith("video/") ||
      [".mp4", ".webm", ".mov", ".m4v", ".mkv"].includes(ext);

    let subType = "processed";
    if (isVideo) {
      subType = "video";
    } else if (isBefore || subTypeInput === "raw") {
      subType = "raw";
    } else if (subTypeInput) {
      subType = subTypeInput;
    }

    const asset = await uploadAndRegisterMedia(buffer, {
      category: "photo",
      subType,
      originalName: file.name,
      mimeType,
      resourceType: isVideo ? "video" : "image",
      tags: ["photography", isVideo ? "video" : "photo", subType],
    });

    return NextResponse.json({
      url: asset.secureUrl,
      publicId: asset.publicId,
      mediaType: isVideo ? "video" : "image",
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      asset,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/photography/upload] Error:", error);
    const errorMessage =
      error?.message ||
      "Cloudinary upload failed. Please check your Cloudinary environment variables.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
