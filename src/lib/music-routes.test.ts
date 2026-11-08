import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const requireAdminSession = vi.fn<() => Promise<NextResponse | null>>();
const track = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: () => requireAdminSession() }));
vi.mock("@/lib/db", () => ({ db: { track } }));

import { POST as createTrack } from "@/app/api/music/tracks/route";
import { DELETE as deleteTrack, GET as getTrack, PATCH as patchTrack } from "@/app/api/music/tracks/[id]/route";
import { POST as playTrack } from "@/app/api/music/tracks/[id]/play/route";

const BASE = "http://localhost:3000";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(url: string, method: string, body: string): NextRequest {
  return new NextRequest(`${BASE}${url}`, {
    method,
    body,
    headers: { "content-type": "application/json" },
  });
}

function playRequest(id: string, headers: Record<string, string>): NextRequest {
  return new NextRequest(`${BASE}/api/music/tracks/${id}/play`, { method: "POST", headers });
}

function prismaError(code: string): Error {
  return Object.assign(new Error(`prisma ${code}`), { code });
}

beforeEach(() => {
  requireAdminSession.mockReset().mockResolvedValue(null);
  for (const fn of Object.values(track)) fn.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/music/tracks/[id]", () => {
  it("get_never_increments", async () => {
    track.findFirst.mockResolvedValue({ id: "t1", title: "A", published: true, playCount: 4 });
    const res = await getTrack(new NextRequest(`${BASE}/api/music/tracks/t1`), ctx("t1"));
    expect(res.status).toBe(200);
    expect(track.findFirst).toHaveBeenCalledWith({ where: { id: "t1", published: true } });
    expect(track.update).not.toHaveBeenCalled();
    expect(track.updateMany).not.toHaveBeenCalled();
  });

  it("unpublished_is_404_for_get_and_play", async () => {
    track.findFirst.mockResolvedValue(null);
    const getRes = await getTrack(new NextRequest(`${BASE}/api/music/tracks/draft`), ctx("draft"));
    expect(getRes.status).toBe(404);
    expect(await getRes.json()).toEqual({ error: "Track not found" });

    track.updateMany.mockResolvedValue({ count: 0 });
    const playRes = await playTrack(playRequest("draft", { origin: BASE, "x-forwarded-for": "10.0.0.1" }), ctx("draft"));
    expect(playRes.status).toBe(404);
  });

  it("db_outage_is_500", async () => {
    track.findFirst.mockRejectedValue(new Error("connection refused"));
    const res = await getTrack(new NextRequest(`${BASE}/api/music/tracks/t1`), ctx("t1"));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/music/tracks/[id]/play", () => {
  it("play_is_atomic_and_limited", async () => {
    track.updateMany.mockResolvedValue({ count: 1 });
    const headers = { origin: BASE, "x-forwarded-for": "203.0.113.9" };
    for (let i = 0; i < 10; i++) {
      const res = await playTrack(playRequest("t-limit", headers), ctx("t-limit"));
      expect(res.status).toBe(204);
    }
    expect(track.updateMany).toHaveBeenCalledWith({
      where: { id: "t-limit", published: true },
      data: { playCount: { increment: 1 } },
    });
    expect(track.update).not.toHaveBeenCalled();

    const limited = await playTrack(playRequest("t-limit", headers), ctx("t-limit"));
    expect(limited.status).toBe(429);
    const retryAfter = Number(limited.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(track.updateMany).toHaveBeenCalledTimes(10);

    // Limit is per IP + track: another track from the same IP still counts.
    const other = await playTrack(playRequest("t-other", headers), ctx("t-other"));
    expect(other.status).toBe(204);
  });

  it("rejects_cross_origin", async () => {
    const crossOrigin = await playTrack(
      playRequest("t1", { origin: "https://evil.example", "x-forwarded-for": "10.0.0.2" }),
      ctx("t1")
    );
    expect(crossOrigin.status).toBe(403);
    const crossSite = await playTrack(
      playRequest("t1", { "sec-fetch-site": "cross-site", "x-forwarded-for": "10.0.0.2" }),
      ctx("t1")
    );
    expect(crossSite.status).toBe(403);
    expect(track.updateMany).not.toHaveBeenCalled();

    track.updateMany.mockResolvedValue({ count: 1 });
    const sameOrigin = await playTrack(
      playRequest("t1", { "sec-fetch-site": "same-origin", "x-forwarded-for": "10.0.0.2" }),
      ctx("t1")
    );
    expect(sameOrigin.status).toBe(204);
  });
});

describe("track writes", () => {
  it("patch_only_p2025_is_404", async () => {
    const body = JSON.stringify({ published: false });
    track.update.mockRejectedValueOnce(prismaError("P2025"));
    expect((await patchTrack(jsonRequest("/api/music/tracks/x", "PATCH", body), ctx("x"))).status).toBe(404);

    track.update.mockRejectedValueOnce(prismaError("P2002"));
    expect((await patchTrack(jsonRequest("/api/music/tracks/x", "PATCH", body), ctx("x"))).status).toBe(409);

    track.update.mockRejectedValueOnce(new Error("connection refused"));
    const outage = await patchTrack(jsonRequest("/api/music/tracks/x", "PATCH", body), ctx("x"));
    expect(outage.status).toBe(500);
    expect(await outage.json()).toEqual({ error: "Failed to update track" });

    track.delete.mockRejectedValueOnce(new Error("connection refused"));
    expect((await deleteTrack(new NextRequest(`${BASE}/api/music/tracks/x`), ctx("x"))).status).toBe(500);
    track.delete.mockRejectedValueOnce(prismaError("P2025"));
    expect((await deleteTrack(new NextRequest(`${BASE}/api/music/tracks/x`), ctx("x"))).status).toBe(404);
  });

  it("invalid_json_is_400", async () => {
    const badJson = await patchTrack(jsonRequest("/api/music/tracks/x", "PATCH", "{not json"), ctx("x"));
    expect(badJson.status).toBe(400);
    const badCreate = await createTrack(jsonRequest("/api/music/tracks", "POST", "{not json"));
    expect(badCreate.status).toBe(400);
    const invalidShape = await createTrack(
      jsonRequest("/api/music/tracks", "POST", JSON.stringify({ title: "A", artist: "B", audioUrl: "http://x" }))
    );
    expect(invalidShape.status).toBe(400);
    const emptyPatch = await patchTrack(jsonRequest("/api/music/tracks/x", "PATCH", "{}"), ctx("x"));
    expect(emptyPatch.status).toBe(400);
    expect(track.create).not.toHaveBeenCalled();
    expect(track.update).not.toHaveBeenCalled();
  });

  it("creates_with_parsed_data_and_requires_admin", async () => {
    track.create.mockResolvedValue({ id: "new" });
    const body = JSON.stringify({
      title: "A",
      artist: "B",
      album: "",
      genre: "",
      duration: 0,
      audioUrl: "https://res.cloudinary.com/demo/video/upload/a.mp3",
      thumbnailUrl: null,
      published: false,
      order: 0,
    });
    const res = await createTrack(jsonRequest("/api/music/tracks", "POST", body));
    expect(res.status).toBe(201);
    expect(track.create).toHaveBeenCalledWith({
      data: {
        title: "A",
        artist: "B",
        album: null,
        genre: null,
        duration: 0,
        audioUrl: "https://res.cloudinary.com/demo/video/upload/a.mp3",
        thumbnailUrl: null,
        published: false,
        order: 0,
      },
    });

    requireAdminSession.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await createTrack(jsonRequest("/api/music/tracks", "POST", body))).status).toBe(401);
    expect((await patchTrack(jsonRequest("/api/music/tracks/x", "PATCH", body), ctx("x"))).status).toBe(401);
    expect(track.create).toHaveBeenCalledTimes(1);
  });
});
