import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteMediaAsset, uploadAndRegisterMedia } from "@/lib/media-service";
import { getErrorMessage } from "@/lib/utils";
import {
  UploadValidationError,
  assertContentLength,
  isUploadedFile,
  validateUpload,
} from "@/lib/upload-validation";
import type { MediaAsset } from "@/lib/types";

// POST /api/music/upload — admin only, upload audio file or thumbnail to Cloudinary with standardized prefix
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

    const audioEntry = formData.get("audio");
    const thumbnailEntry = formData.get("thumbnail");
    if ((audioEntry !== null && !isUploadedFile(audioEntry)) ||
        (thumbnailEntry !== null && !isUploadedFile(thumbnailEntry))) {
      return NextResponse.json({ error: "'audio' and 'thumbnail' must be files" }, { status: 400 });
    }
    if (!audioEntry && !thumbnailEntry) {
      return NextResponse.json(
        { error: "No files provided. Send 'audio' or 'thumbnail' field." },
        { status: 400 }
      );
    }

    // Validate every part before any upload, so an invalid second part
    // never leaves the first one uploaded.
    const audio = audioEntry ? await validateUpload(audioEntry, "audio") : null;
    const thumbnail = thumbnailEntry ? await validateUpload(thumbnailEntry, "thumbnail") : null;

    const result: {
      audioUrl?: string;
      thumbnailUrl?: string;
      audioAsset?: MediaAsset;
      thumbAsset?: MediaAsset;
    } = {};

    // Upload audio file with prefix: music-audio-...
    if (audio && audioEntry) {
      const audioAsset = await uploadAndRegisterMedia(audio.buffer, {
        category: "music",
        subType: "audio",
        originalName: audioEntry.name,
        mimeType: audio.mimeType,
        resourceType: "video", // Cloudinary uses video resource_type for audio
      });
      result.audioUrl = audioAsset.secureUrl;
      result.audioAsset = audioAsset;
    }

    // Upload thumbnail image with prefix: music-thumb-...
    if (thumbnail && thumbnailEntry) {
      try {
        const thumbAsset = await uploadAndRegisterMedia(thumbnail.buffer, {
          category: "music",
          subType: "thumb",
          originalName: thumbnailEntry.name,
          mimeType: thumbnail.mimeType,
          resourceType: "image",
        });
        result.thumbnailUrl = thumbAsset.secureUrl;
        result.thumbAsset = thumbAsset;
      } catch (error) {
        // The client gets nothing back on failure, so roll back the audio
        // uploaded above instead of leaving an orphan in the media library.
        if (result.audioAsset) {
          await deleteMediaAsset(result.audioAsset.publicId).catch((cleanupError: unknown) =>
            console.error("[POST /api/music/upload] Audio rollback failed:", getErrorMessage(cleanupError))
          );
        }
        throw error;
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    // Provider errors can carry config details; keep them in server logs only.
    console.error("[POST /api/music/upload] Upload failed:", getErrorMessage(error));
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
