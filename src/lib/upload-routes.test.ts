import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const requireAdminSession = vi.fn<() => Promise<NextResponse | null>>();
const uploadAndRegisterMedia = vi.fn();

vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: () => requireAdminSession() }));
vi.mock("@/lib/media-service", () => ({
  uploadAndRegisterMedia: (...args: unknown[]) => uploadAndRegisterMedia(...args),
}));

import { POST as photoUpload } from "@/app/api/admin/photography/upload/route";
import { POST as musicUpload } from "@/app/api/music/upload/route";

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00];
const MP3 = [0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

function file(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function multipart(url: string, fields: Record<string, string | File>): NextRequest {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return new NextRequest(url, { method: "POST", body });
}

const fakeAsset = {
  secureUrl: "https://res.cloudinary.com/x/image/upload/a.jpg",
  publicId: "a",
  width: 1,
  height: 1,
  duration: null,
};

beforeEach(() => {
  requireAdminSession.mockReset().mockResolvedValue(null);
  uploadAndRegisterMedia.mockReset().mockResolvedValue(fakeAsset);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("upload routes", () => {
  it("auth_precedes_body", async () => {
    requireAdminSession.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    for (const handler of [photoUpload, musicUpload]) {
      const req = multipart("http://localhost/api/x", { file: file(JPEG, "a.jpg", "image/jpeg") });
      const formDataSpy = vi.spyOn(req, "formData");
      const res = await handler(req);
      expect(res.status).toBe(401);
      expect(formDataSpy).not.toHaveBeenCalled();
    }
    expect(uploadAndRegisterMedia).not.toHaveBeenCalled();
  });

  it("validates_all_parts_before_upload", async () => {
    const req = multipart("http://localhost/api/music/upload", {
      audio: file(MP3, "song.mp3", "audio/mpeg"),
      thumbnail: file([0x3c, 0x73, 0x76, 0x67], "cover.svg", "image/svg+xml"),
    });
    const res = await musicUpload(req);
    expect(res.status).toBe(415);
    expect(uploadAndRegisterMedia).not.toHaveBeenCalled();
  });

  it("uploads_valid_music_parts_with_server_subtypes", async () => {
    const req = multipart("http://localhost/api/music/upload", {
      audio: file(MP3, "song.mp3", "audio/mpeg"),
      thumbnail: file(JPEG, "cover.jpg", "image/jpeg"),
    });
    const res = await musicUpload(req);
    expect(res.status).toBe(201);
    expect(uploadAndRegisterMedia).toHaveBeenCalledTimes(2);
    expect(uploadAndRegisterMedia.mock.calls[0][1]).toMatchObject({ subType: "audio", mimeType: "audio/mpeg" });
    expect(uploadAndRegisterMedia.mock.calls[1][1]).toMatchObject({ subType: "thumb", mimeType: "image/jpeg" });
  });

  it("rejects_photo_path_subtype_without_upload", async () => {
    const req = multipart("http://localhost/api/admin/photography/upload", {
      file: file(JPEG, "a.jpg", "image/jpeg"),
      subType: "../../secret",
    });
    const res = await photoUpload(req);
    expect(res.status).toBe(400);
    expect(uploadAndRegisterMedia).not.toHaveBeenCalled();
  });

  it("rejects_declared_oversized_body_before_parsing", async () => {
    const req = multipart("http://localhost/api/admin/photography/upload", {
      file: file(JPEG, "a.jpg", "image/jpeg"),
    });
    req.headers.set("content-length", String(60 * 1024 * 1024 + 1));
    const formDataSpy = vi.spyOn(req, "formData");
    const res = await photoUpload(req);
    expect(res.status).toBe(413);
    expect(formDataSpy).not.toHaveBeenCalled();
  });

  it("does_not_leak_provider_error", async () => {
    uploadAndRegisterMedia.mockRejectedValue(new Error("Invalid api_secret=abc123 for cloud_name=demo"));
    const photoRes = await photoUpload(
      multipart("http://localhost/api/admin/photography/upload", { file: file(JPEG, "a.jpg", "image/jpeg") })
    );
    expect(photoRes.status).toBe(500);
    expect(await photoRes.json()).toEqual({ error: "Upload failed" });

    const musicRes = await musicUpload(
      multipart("http://localhost/api/music/upload", { audio: file(MP3, "s.mp3", "audio/mpeg") })
    );
    expect(musicRes.status).toBe(500);
    expect(await musicRes.json()).toEqual({ error: "Upload failed" });
  });
});
