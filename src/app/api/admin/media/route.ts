import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/admin-auth";
import {
  getMediaAssets,
  uploadAndRegisterMedia,
  deleteMediaAsset,
} from "@/lib/media-service";
import type { MediaCategory } from "@/lib/types";

export async function GET(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";
    const resourceType = searchParams.get("type") || "all";
    const search = searchParams.get("q") || "";

    const allAssets = getMediaAssets(); // full list for computing stats
    const filteredAssets = getMediaAssets({ category, resourceType, search });

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
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as MediaCategory) || "general";
    const subType = (formData.get("subType") as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const asset = await uploadAndRegisterMedia(buffer, {
      category,
      subType,
      originalName: file.name,
      mimeType: file.type,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/media] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json({ error: "publicId parameter is required" }, { status: 400 });
    }

    await deleteMediaAsset(publicId);
    return NextResponse.json({ success: true, publicId });
  } catch (error: any) {
    console.error("[DELETE /api/admin/media] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete media asset" },
      { status: 500 }
    );
  }
}
