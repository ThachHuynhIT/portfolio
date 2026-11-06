import { describe, expect, it } from "vitest";
import { buildMetadata, toOgImage } from "./seo";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1/folder/cover.jpg";

describe("buildMetadata", () => {
  it("omits_blank_metadata", () => {
    for (const blank of [undefined, null, ""]) {
      const meta = buildMetadata({
        title: blank,
        description: blank,
        siteName: blank,
        image: blank,
        path: "/blog",
      });
      expect(meta).not.toHaveProperty("title");
      expect(meta).not.toHaveProperty("description");
      expect(meta.openGraph).not.toHaveProperty("title");
      expect(meta.openGraph).not.toHaveProperty("description");
      expect(meta.openGraph).not.toHaveProperty("siteName");
      expect(meta.openGraph).not.toHaveProperty("images");
      expect(meta.twitter).not.toHaveProperty("title");
      expect(meta.twitter).not.toHaveProperty("description");
      expect(meta.twitter).not.toHaveProperty("images");
      expect(meta.twitter).toMatchObject({ card: "summary" });
    }
  });

  it("canonical_and_article_type_preserved", () => {
    const meta = buildMetadata({
      title: "Post",
      description: "Desc",
      path: "/blog/my-post",
      type: "article",
      siteName: "Site",
      image: CLOUDINARY,
    });
    expect(meta.alternates).toEqual({ canonical: "/blog/my-post" });
    expect(meta.title).toBe("Post");
    expect(meta.description).toBe("Desc");
    expect(meta.openGraph).toMatchObject({
      url: "/blog/my-post",
      type: "article",
      title: "Post",
      description: "Desc",
      siteName: "Site",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Post" });

    const defaults = buildMetadata({ path: "/" });
    expect(defaults.alternates).toEqual({ canonical: "/" });
    expect(defaults.openGraph).toMatchObject({ url: "/", type: "website" });
  });
});

describe("toOgImage", () => {
  it("og_image_has_1200_630_only_when_transformed", () => {
    expect(toOgImage(CLOUDINARY)).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/w_1200,h_630,c_fill,g_auto/v1/folder/cover.jpg",
      width: 1200,
      height: 630,
    });

    const external = "https://example.com/cover.jpg";
    expect(toOgImage(external)).toEqual({ url: external });
    expect(toOgImage(external)).not.toHaveProperty("width");
    expect(toOgImage(external)).not.toHaveProperty("height");

    const meta = buildMetadata({ path: "/x", image: external });
    expect(meta.openGraph).toMatchObject({ images: [{ url: external }] });
  });
});
