import { describe, expect, it } from "vitest";
import { toPublicAlbum, type AlbumMember } from "./album-cover";
import type { PhotoAlbum } from "./types";

const album = (overrides: Partial<PhotoAlbum> = {}): PhotoAlbum => ({
  id: "album-1",
  title: "Trip",
  slug: "trip",
  coverImage: "https://img/a-old.jpg",
  coverPhotoId: "a",
  photoIds: ["a", "b", "c"],
  order: 1,
  featured: false,
  published: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const members: AlbumMember[] = [
  { id: "a", image: "https://img/a.jpg", published: true },
  { id: "b", image: "https://img/b.jpg", published: true },
  { id: "c", image: "https://img/c.jpg", published: false },
];

describe("toPublicAlbum", () => {
  it("lists only published members", () => {
    expect(toPublicAlbum(album(), members).photoIds).toEqual(["a", "b"]);
  });

  it("uses the cover photo's current image, not the stored URL", () => {
    expect(toPublicAlbum(album(), members).coverImage).toBe("https://img/a.jpg");
  });

  it("never exposes an unpublished cover photo", () => {
    const result = toPublicAlbum(album({ coverPhotoId: "c", coverImage: "https://img/c.jpg" }), members);
    expect(result.coverImage).toBe("https://img/a.jpg");
  });

  it("falls back to the first published member when the cover left the album", () => {
    expect(toPublicAlbum(album({ coverPhotoId: "gone" }), members).coverImage).toBe("https://img/a.jpg");
  });

  it("keeps a custom cover URL that is not tied to a photo", () => {
    const result = toPublicAlbum(album({ coverPhotoId: undefined, coverImage: "https://img/custom.jpg" }), members);
    expect(result.coverImage).toBe("https://img/custom.jpg");
  });

  it("has no photos and no cover when nothing is published", () => {
    const hidden = members.map((m) => ({ ...m, published: false }));
    const result = toPublicAlbum(album(), hidden);
    expect(result.photoIds).toEqual([]);
    expect(result.coverImage).toBe("");
  });
});
