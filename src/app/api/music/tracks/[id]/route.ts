import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/music/tracks/[id] — fetch single track + increment play count
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const track = await db.track.update({
      where: { id },
      data: { playCount: { increment: 1 } },
    });
    return NextResponse.json(track);
  } catch {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
}

// PATCH /api/music/tracks/[id] — update a track
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { title, artist, album, duration, audioUrl, thumbnailUrl, genre, order, published } = body;

    const track = await db.track.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(artist !== undefined && { artist }),
        ...(album !== undefined && { album }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(genre !== undefined && { genre }),
        ...(order !== undefined && { order: Number(order) }),
        ...(published !== undefined && { published }),
      },
    });
    return NextResponse.json(track);
  } catch {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
}

// DELETE /api/music/tracks/[id] — delete a track
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.track.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
}
