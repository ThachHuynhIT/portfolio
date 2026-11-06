import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createRateLimiter, getClientIp, isSameOriginRequest } from "@/lib/rate-limit";
import { getErrorMessage } from "@/lib/utils";

// 10 plays per minute per client IP + track. In-memory, so the limit is
// per server instance (see rate-limit.ts); a shared store is out of scope.
const playLimiter = createRateLimiter({ max: 10, windowMs: 60_000 });

// POST /api/music/tracks/[id]/play — public, records one play of a
// published track. GET /api/music/tracks/[id] never mutates.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(req.headers, req.url)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const key = `${getClientIp(req.headers)}:${id}`;
  if (playLimiter.isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, playLimiter.getRetryAfterSeconds(key))) },
      }
    );
  }
  playLimiter.recordAttempt(key);

  try {
    const { count } = await db.track.updateMany({
      where: { id, published: true },
      data: { playCount: { increment: 1 } },
    });
    if (count === 0) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("[POST /api/music/tracks/[id]/play]", getErrorMessage(error));
    return NextResponse.json({ error: "Failed to record play" }, { status: 500 });
  }
}
