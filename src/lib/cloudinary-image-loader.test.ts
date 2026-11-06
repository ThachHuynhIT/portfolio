import { describe, expect, it } from "vitest";
import cloudinaryImageLoader, { insertCloudinaryTransform } from "./cloudinary-image-loader";

const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1712345678/folder/photo.jpg";

describe("insertCloudinaryTransform", () => {
  it("inserts_transform_after_upload_marker", () => {
    expect(insertCloudinaryTransform(CLOUDINARY, "w_400")).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_400/v1712345678/folder/photo.jpg",
    );
  });

  it("keeps_non_cloudinary_url_unchanged", () => {
    const url = "https://example.com/images/photo.jpg";
    expect(insertCloudinaryTransform(url, "w_400")).toBe(url);
    expect(cloudinaryImageLoader({ src: url, width: 640 })).toBe(url);
    expect(cloudinaryImageLoader({ src: "/local/photo.png", width: 640, quality: 75 })).toBe(
      "/local/photo.png",
    );
  });

  it("preserves_version_and_query", () => {
    const src = `${CLOUDINARY}?_a=BAMAAAB0`;
    expect(cloudinaryImageLoader({ src, width: 828 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,c_limit,w_828,q_auto/v1712345678/folder/photo.jpg?_a=BAMAAAB0",
    );
    expect(cloudinaryImageLoader({ src, width: 828, quality: 60 })).toContain(
      "/upload/f_auto,c_limit,w_828,q_60/v1712345678/",
    );
  });
});

describe("cloudinaryImageLoader unsplash", () => {
  it("unsplash_width_quality", () => {
    const src = "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=2000&q=90";
    const out = new URL(cloudinaryImageLoader({ src, width: 384 }));
    expect(out.hostname).toBe("images.unsplash.com");
    expect(out.pathname).toBe("/photo-123");
    expect(out.searchParams.get("w")).toBe("384");
    expect(out.searchParams.get("q")).toBe("80");
    expect(out.searchParams.get("auto")).toBe("format");
    expect(out.searchParams.get("fit")).toBe("crop");
    expect(out.searchParams.getAll("w")).toHaveLength(1);

    const withQuality = new URL(cloudinaryImageLoader({ src, width: 1080, quality: 50 }));
    expect(withQuality.searchParams.get("w")).toBe("1080");
    expect(withQuality.searchParams.get("q")).toBe("50");
  });
});
