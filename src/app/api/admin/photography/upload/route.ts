import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/utils";
import { uploadAndRegisterMedia } from "@/lib/media-service";
import {
  UploadValidationError,
  assertContentLength,
  isUploadedFile,
  parsePhotoSubType,
  validateUpload,
} from "@/lib/upload-validation";

export async function POST(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    assertContentLength(req.headers);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!isUploadedFile(file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isVideo = file.type.toLowerCase().startsWith("video/");
    const subType = parsePhotoSubType(
      formData.get("subType"),
      formData.get("isBefore") === "true",
      isVideo
    );
    const upload = await validateUpload(file, isVideo ? "video" : "photo");

    const asset = await uploadAndRegisterMedia(upload.buffer, {
      category: "photo",
      subType,
      originalName: file.name,
      mimeType: upload.mimeType,
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
  } catch (error: unknown) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    // Provider errors can carry config details; keep them in server logs only.
    console.error("[POST /api/admin/photography/upload] Upload failed:", getErrorMessage(error));
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
