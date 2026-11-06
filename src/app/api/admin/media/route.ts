import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/utils";
import {
  getMediaAssets,
  uploadAndRegisterMedia,
  deleteMediaAsset,
} from "@/lib/media-service";
import {
  UploadValidationError,
  assertContentLength,
  isUploadedFile,
  mediaUploadKind,
  parseMediaCategory,
  parseMediaSubType,
  validateUpload,
} from "@/lib/upload-validation";

export async function GET(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";
    const resourceType = searchParams.get("type") || "all";
    const search = searchParams.get("q") || "";

    const allAssets = await getMediaAssets(); // full list for computing stats
    const filteredAssets = await getMediaAssets({ category, resourceType, search });

    // Compute stats
    let totalBytes = 0;
    let totalImages = 0;
    let totalVideos = 0;
    let totalAudios = 0;
    const categoryCounts: Record<string, number> = {};

    for (const asset of allAssets) {
      totalBytes += asset.bytes || 0;
      categoryCounts[asset.category] = (categoryCounts[asset.category] || 0) + 1;

      const isAudio =
        asset.subType === "audio" ||
        ["mp3", "wav", "aac", "ogg", "flac"].includes(asset.format.toLowerCase());

      if (isAudio) {
        totalAudios++;
      } else if (asset.resourceType === "video") {
        totalVideos++;
      } else {
        totalImages++;
      }
    }

    return NextResponse.json({
      assets: filteredAssets,
      stats: {
        totalFiles: allAssets.length,
        totalBytes,
        totalImages,
        totalVideos,
        totalAudios,
        categoryCounts,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/media] Error:", error);
    return NextResponse.json({ error: "Failed to fetch media assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    assertContentLength(req.headers);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!isUploadedFile(file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const category = parseMediaCategory(formData.get("category"));
    const subType = parseMediaSubType(formData.get("subType"));
    const { buffer, mimeType } = await validateUpload(file, mediaUploadKind(file));

    const asset = await uploadAndRegisterMedia(buffer, {
      category,
      subType,
      originalName: file.name,
      mimeType,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/admin/media] Error:", getErrorMessage(error));
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json({ error: "publicId parameter is required" }, { status: 400 });
    }

    await deleteMediaAsset(publicId);
    return NextResponse.json({ success: true, publicId });
  } catch (error) {
    console.error("[DELETE /api/admin/media] Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) || "Failed to delete media asset" },
      { status: 500 }
    );
  }
}
