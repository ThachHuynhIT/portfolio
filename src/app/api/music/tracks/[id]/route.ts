import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { describeIssues, patchTrackSchema, trackWriteErrorStatus } from "@/lib/music-schema";
import { getErrorMessage } from "@/lib/utils";

const NOT_FOUND = { error: "Track not found" };

// GET /api/music/tracks/[id] — public, read-only; drafts are 404.
// Plays are recorded by POST /api/music/tracks/[id]/play.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const track = await db.track.findFirst({ where: { id, published: true } });
    if (!track) return NextResponse.json(NOT_FOUND, { status: 404 });
    return NextResponse.json(track);
  } catch (error: unknown) {
    console.error("[GET /api/music/tracks/[id]]", getErrorMessage(error));
    return NextResponse.json({ error: "Failed to fetch track" }, { status: 500 });
  }
}

// PATCH /api/music/tracks/[id] — admin only, update a track
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid track data", issues: describeIssues(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const track = await db.track.update({ where: { id }, data: parsed.data });
    return NextResponse.json(track);
  } catch (error: unknown) {
    const status = trackWriteErrorStatus(error);
    if (status === 404) return NextResponse.json(NOT_FOUND, { status });
    if (status === 409) return NextResponse.json({ error: "Track conflicts with an existing one" }, { status });
    console.error("[PATCH /api/music/tracks/[id]]", getErrorMessage(error));
    return NextResponse.json({ error: "Failed to update track" }, { status: 500 });
  }
}

// DELETE /api/music/tracks/[id] — admin only, delete a track
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;
  const { id } = await params;
  try {
    await db.track.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (trackWriteErrorStatus(error) === 404) return NextResponse.json(NOT_FOUND, { status: 404 });
    console.error("[DELETE /api/music/tracks/[id]]", getErrorMessage(error));
    return NextResponse.json({ error: "Failed to delete track" }, { status: 500 });
  }
}
