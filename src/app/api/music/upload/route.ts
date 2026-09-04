import { NextRequest, NextResponse } from "next/server";
import { uploadAndRegisterMedia } from "@/lib/media-service";
import type { MediaAsset } from "@/lib/types";

// POST /api/music/upload — upload audio file or thumbnail to Cloudinary with standardized prefix
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    const result: {
      audioUrl?: string;
      thumbnailUrl?: string;
      audioAsset?: MediaAsset;
      thumbAsset?: MediaAsset;
    } = {};

    // Upload audio file with prefix: music-audio-...
    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const audioAsset = await uploadAndRegisterMedia(buffer, {
        category: "music",
        subType: "audio",
        originalName: audioFile.name,
        mimeType: audioFile.type || "audio/mpeg",
        resourceType: "video", // Cloudinary uses video resource_type for audio
      });

      result.audioUrl = audioAsset.secureUrl;
      result.audioAsset = audioAsset;
    }

    // Upload thumbnail image with prefix: music-thumb-...
    if (thumbnailFile) {
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const thumbAsset = await uploadAndRegisterMedia(buffer, {
        category: "music",
        subType: "thumb",
        originalName: thumbnailFile.name,
        mimeType: thumbnailFile.type || "image/jpeg",
        resourceType: "image",
      });

      result.thumbnailUrl = thumbAsset.secureUrl;
      result.thumbAsset = thumbAsset;
    }

    if (!result.audioUrl && !result.thumbnailUrl) {
      return NextResponse.json(
        { error: "No files provided. Send 'audio' or 'thumbnail' field." },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/music/upload] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
