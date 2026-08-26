import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// POST /api/music/upload — upload audio file or thumbnail to Cloudinary
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    const result: { audioUrl?: string; thumbnailUrl?: string } = {};

    // Upload audio file
    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUri = `data:${audioFile.type};base64,${base64}`;

      const audioResult = await cloudinary.uploader.upload(dataUri, {
        folder: "portfolio/music/audio",
        resource_type: "video", // Cloudinary uses "video" type for audio files
        format: "mp3",
      });
      result.audioUrl = audioResult.secure_url;
    }

    // Upload thumbnail image
    if (thumbnailFile) {
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const dataUri = `data:${thumbnailFile.type};base64,${base64}`;

      const thumbResult = await uploadImage(dataUri, {
        folder: "portfolio/music/thumbnails",
      });
      result.thumbnailUrl = thumbResult.url;
    }

    if (!result.audioUrl && !result.thumbnailUrl) {
      return NextResponse.json(
        { error: "No files provided. Send 'audio' or 'thumbnail' field." },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/music/upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
