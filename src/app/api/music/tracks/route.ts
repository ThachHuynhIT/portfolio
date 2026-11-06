import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { createTrackSchema, describeIssues, trackWriteErrorStatus } from "@/lib/music-schema";
import { getErrorMessage } from "@/lib/utils";

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
  const authError = await requireAdminSession();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid track data", issues: describeIssues(parsed.error) },
      { status: 400 }
    );
  }

  try {
    const track = await db.track.create({ data: parsed.data });
    return NextResponse.json(track, { status: 201 });
  } catch (error: unknown) {
    if (trackWriteErrorStatus(error) === 409) {
      return NextResponse.json({ error: "Track conflicts with an existing one" }, { status: 409 });
    }
    console.error("[POST /api/music/tracks]", getErrorMessage(error));
    return NextResponse.json({ error: "Failed to create track" }, { status: 500 });
  }
}
