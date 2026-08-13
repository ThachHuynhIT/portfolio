import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/music/tracks — public, fetch all published tracks
export async function GET() {
  try {
    const tracks = await db.track.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tracks);
  } catch (error) {
    console.error("[GET /api/music/tracks]", error);
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 });
  }
}

// POST /api/music/tracks — admin only, add new track
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, artist, album, duration, audioUrl, thumbnailUrl, genre, order, published } = body;

    if (!title || !artist || !audioUrl) {
      return NextResponse.json(
        { error: "title, artist, and audioUrl are required" },
        { status: 400 }
      );
    }

    const track = await db.track.create({
      data: {
        title,
        artist,
        album: album ?? null,
        duration: duration ? Number(duration) : 0,
        audioUrl,
        thumbnailUrl: thumbnailUrl ?? null,
        genre: genre ?? null,
        order: order ? Number(order) : 0,
        published: published !== false,
      },
    });

    return NextResponse.json(track, { status: 201 });
  } catch (error) {
    console.error("[POST /api/music/tracks]", error);
    return NextResponse.json({ error: "Failed to create track" }, { status: 500 });
  }
}
