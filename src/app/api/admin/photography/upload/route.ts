import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import { cloudinary } from "@/lib/cloudinary";
import path from "path";
// @ts-expect-error heic-convert does not provide official TS declarations
import convertHeic from "heic-convert";

// Configure Cloudinary explicitly
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);

    const ext = (path.extname(file.name) || ".jpg").toLowerCase();
    let mimeType = file.type || "image/jpeg";
    const isVideo =
      mimeType.startsWith("video/") ||
      [".mp4", ".webm", ".mov", ".m4v", ".mkv"].includes(ext);

    // 1. If image is HEIC/HEIF (e.g. from iPhone), convert to JPEG buffer first
    const isHeic =
      [".heic", ".heif"].includes(ext) ||
      mimeType === "image/heic" ||
      mimeType === "image/heif";

    if (isHeic) {
      try {
        const converted = await convertHeic({
          buffer,
          format: "JPEG",
          quality: 0.92,
        });
        buffer = Buffer.from(converted);
        mimeType = "image/jpeg";
      } catch (convErr) {
        console.warn("[Upload] Failed to convert HEIC to JPEG:", convErr);
      }
    }

    // 2. Upload directly to Cloudinary
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    if (isVideo) {
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: "portfolio/photography/videos",
        resource_type: "video",
      });

      return NextResponse.json({
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        mediaType: "video",
        width: uploadRes.width,
        height: uploadRes.height,
        duration: uploadRes.duration,
      });
    } else {
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        folder: "portfolio/photography",
        resource_type: "image",
      });

      return NextResponse.json({
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        mediaType: "image",
        width: uploadRes.width,
        height: uploadRes.height,
      });
    }
  } catch (error: any) {
    console.error("[POST /api/admin/photography/upload] Error:", error);
    const errorMessage =
      error?.message ||
      "Cloudinary upload failed. Please check your Cloudinary environment variables.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
