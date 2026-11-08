import { describe, expect, it } from "vitest";
import { createTrackSchema, patchTrackSchema, trackWriteErrorStatus } from "./music-schema";

const validTrack = {
  title: "Night Drive",
  artist: "Thach",
  album: "Demos",
  genre: "Lo-fi",
  duration: 210,
  audioUrl: "https://res.cloudinary.com/demo/video/upload/sample.mp3",
  thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/cover.jpg",
  order: 3,
  published: true,
};

describe("createTrackSchema", () => {
  it("rejects_nan_infinite_negative_duration", () => {
    expect(createTrackSchema.safeParse({ ...validTrack, duration: NaN }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, duration: Infinity }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, duration: -1 }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, duration: "210" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, order: 1.5 }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, order: -1 }).success).toBe(false);
  });

  it("rejects_non_https_urls", () => {
    expect(createTrackSchema.safeParse({ ...validTrack, audioUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, audioUrl: "http://example.com/a.mp3" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, audioUrl: "/music/a.mp3" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, thumbnailUrl: "data:image/png;base64,AA" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, thumbnailUrl: null }).success).toBe(true);
  });

  it("rejects_wrong_boolean_and_unknown_keys", () => {
    expect(createTrackSchema.safeParse({ ...validTrack, published: "false" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, playCount: 999 }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, id: "x" }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, title: "   " }).success).toBe(false);
    expect(createTrackSchema.safeParse({ ...validTrack, artist: "a".repeat(201) }).success).toBe(false);
  });

  it("applies_defaults_and_blank_optional_text", () => {
    const parsed = createTrackSchema.parse({
      title: " Night Drive ",
      artist: "Thach",
      audioUrl: validTrack.audioUrl,
      album: "",
      genre: "  ",
    });
    expect(parsed).toEqual({
      title: "Night Drive",
      artist: "Thach",
      audioUrl: validTrack.audioUrl,
      album: null,
      genre: null,
      thumbnailUrl: null,
      duration: 0,
      order: 0,
      published: true,
    });
  });
});

describe("patchTrackSchema", () => {
  it("rejects_empty_patch", () => {
    expect(patchTrackSchema.safeParse({}).success).toBe(false);
    expect(patchTrackSchema.safeParse({ playCount: 5 }).success).toBe(false);
    expect(patchTrackSchema.safeParse({ id: "other" }).success).toBe(false);
  });

  it("preserves_zero_duration_and_order", () => {
    expect(patchTrackSchema.parse({ duration: 0 })).toEqual({ duration: 0 });
    expect(patchTrackSchema.parse({ order: 0, published: false })).toEqual({ order: 0, published: false });
    expect(patchTrackSchema.parse({ ...validTrack, album: "" })).toEqual({ ...validTrack, album: null });
  });
});

describe("trackWriteErrorStatus", () => {
  it("maps_only_known_prisma_codes", () => {
    expect(trackWriteErrorStatus({ code: "P2025" })).toBe(404);
    expect(trackWriteErrorStatus({ code: "P2002" })).toBe(409);
    expect(trackWriteErrorStatus({ code: "P1001" })).toBe(500);
    expect(trackWriteErrorStatus(new Error("connection refused"))).toBe(500);
  });
});
