import { describe, expect, it, vi } from "vitest";
import {
  UPLOAD_LIMITS,
  UploadValidationError,
  assertContentLength,
  mediaUploadKind,
  parseMediaCategory,
  parseMediaSubType,
  parsePhotoSubType,
  validateUpload,
} from "./upload-validation";

const MiB = 1024 * 1024;

const SIG = {
  jpeg: [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d],
  // ISO-BMFF box: size(4) "ftyp" major brand minor version compatible brands
  heic: [
    0x00, 0x00, 0x00, 0x18, ...ascii("ftyp"), ...ascii("heic"), 0x00, 0x00, 0x00, 0x00,
    ...ascii("mif1"), ...ascii("heic"),
  ],
  mp4: [
    0x00, 0x00, 0x00, 0x18, ...ascii("ftyp"), ...ascii("isom"), 0x00, 0x00, 0x02, 0x00,
    ...ascii("isom"), ...ascii("mp41"),
  ],
  mp3: [...ascii("ID3"), 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  pdf: [...ascii("%PDF-1.7"), 0x0a],
};

function ascii(value: string): number[] {
  return Array.from(value, (c) => c.charCodeAt(0));
}

function makeFile(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function withFakeSize(file: File, size: number): File {
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateUpload", () => {
  it("rejects_size_limit_plus_one", async () => {
    const oversizedPhoto = withFakeSize(makeFile(SIG.jpeg, "a.jpg", "image/jpeg"), 10 * MiB + 1);
    const readArrayBufferSpy = vi.spyOn(oversizedPhoto, "arrayBuffer");
    await expect(validateUpload(oversizedPhoto, "photo")).rejects.toMatchObject({ status: 413 });
    expect(readArrayBufferSpy).not.toHaveBeenCalled();

    const oversizedThumb = withFakeSize(makeFile(SIG.png, "t.png", "image/png"), 5 * MiB + 1);
    await expect(validateUpload(oversizedThumb, "thumbnail")).rejects.toMatchObject({ status: 413 });

    const oversizedAudio = withFakeSize(makeFile(SIG.mp3, "s.mp3", "audio/mpeg"), 50 * MiB + 1);
    const audioSpy = vi.spyOn(oversizedAudio, "arrayBuffer");
    await expect(validateUpload(oversizedAudio, "audio")).rejects.toMatchObject({ status: 413 });
    expect(audioSpy).not.toHaveBeenCalled();
  });

  it("accepts_exact_limit", async () => {
    expect(UPLOAD_LIMITS.photo).toBe(10 * MiB);
    const bytes = new Uint8Array(UPLOAD_LIMITS.photo);
    bytes.set(SIG.jpeg);
    const file = new File([bytes], "Exact.JPG", { type: "image/jpeg" });
    const result = await validateUpload(file, "photo");
    expect(result.buffer.length).toBe(10 * MiB);
    expect(result).toMatchObject({ mimeType: "image/jpeg", extension: ".jpg" });
  });

  it("rejects_zero_bytes", async () => {
    await expect(validateUpload(makeFile([], "a.jpg", "image/jpeg"), "photo")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects_mime_extension_mismatch", async () => {
    // png bytes + png MIME but .jpg extension
    await expect(validateUpload(makeFile(SIG.png, "a.jpg", "image/png"), "photo")).rejects.toMatchObject({
      status: 415,
    });
    // empty MIME with an unknown extension is a 415
    await expect(validateUpload(makeFile(SIG.jpeg, "a.bin", ""), "photo")).rejects.toMatchObject({
      status: 415,
    });
    // an audio file sent as a photo
    await expect(validateUpload(makeFile(SIG.mp3, "a.mp3", "audio/mpeg"), "photo")).rejects.toMatchObject({
      status: 415,
    });
  });

  it("rejects_forged_signature", async () => {
    const html = ascii("<html><script>alert(1)</script></html>");
    await expect(validateUpload(makeFile(html, "a.jpg", "image/jpeg"), "photo")).rejects.toMatchObject({
      status: 415,
    });
    await expect(validateUpload(makeFile(SIG.png, "a.mp3", "audio/mpeg"), "audio")).rejects.toMatchObject({
      status: 415,
    });
    // an HEIC image is not an MP4 video even though both are ISO-BMFF
    await expect(validateUpload(makeFile(SIG.heic, "v.mp4", "video/mp4"), "video")).rejects.toMatchObject({
      status: 415,
    });
  });

  it("accepts_heic_signature", async () => {
    const result = await validateUpload(makeFile(SIG.heic, "IMG_0001.HEIC", "image/heic"), "photo");
    expect(result).toMatchObject({ mimeType: "image/heic", extension: ".heic" });
    const video = await validateUpload(makeFile(SIG.mp4, "clip.mp4", "video/mp4"), "video");
    expect(video).toMatchObject({ mimeType: "video/mp4", extension: ".mp4" });
  });

  it("infers_mime_from_extension_when_browser_sends_none", async () => {
    // Windows browsers often send HEIC files with an empty type.
    const heic = await validateUpload(makeFile(SIG.heic, "IMG_0002.heic", ""), "photo");
    expect(heic).toMatchObject({ mimeType: "image/heic", extension: ".heic" });
    // ...but the signature must still match the inferred type.
    await expect(validateUpload(makeFile(SIG.png, "IMG_0003.heic", ""), "photo")).rejects.toMatchObject({
      status: 415,
    });
  });

  it("accepts_pdf_documents_only_with_pdf_signature", async () => {
    const pdf = await validateUpload(makeFile(SIG.pdf, "resume.pdf", "application/pdf"), "document");
    expect(pdf).toMatchObject({ mimeType: "application/pdf", extension: ".pdf" });
    const html = ascii("<html></html>");
    await expect(validateUpload(makeFile(html, "resume.pdf", "application/pdf"), "document")).rejects.toMatchObject({
      status: 415,
    });
    await expect(validateUpload(makeFile(SIG.pdf, "resume.pdf", "application/pdf"), "photo")).rejects.toMatchObject({
      status: 415,
    });
  });

  it("rejects_svg", async () => {
    const svg = ascii('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await expect(validateUpload(makeFile(svg, "x.svg", "image/svg+xml"), "photo")).rejects.toMatchObject({
      status: 415,
    });
    await expect(validateUpload(makeFile(svg, "x.svg", "image/svg+xml"), "thumbnail")).rejects.toMatchObject({
      status: 415,
    });
  });

  it("returns_typed_errors", async () => {
    const error = await validateUpload(makeFile([], "a.jpg", "image/jpeg"), "photo").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(UploadValidationError);
  });
});

describe("parsePhotoSubType", () => {
  it("rejects_path_subtype", () => {
    expect(() => parsePhotoSubType("../../secret", false, false)).toThrow(UploadValidationError);
    expect(() => parsePhotoSubType("processed/../x", false, false)).toThrow();
    expect(() => parsePhotoSubType("video", false, false)).toThrow();
  });

  it("maps_defaults_and_overrides", () => {
    expect(parsePhotoSubType(null, false, false)).toBe("processed");
    expect(parsePhotoSubType("", false, false)).toBe("processed");
    expect(parsePhotoSubType("raw", false, false)).toBe("raw");
    expect(parsePhotoSubType(null, true, false)).toBe("raw");
    expect(parsePhotoSubType("processed", false, true)).toBe("video");
  });
});

describe("media upload helpers", () => {
  it("picks_kind_from_type_or_extension", () => {
    expect(mediaUploadKind(makeFile(SIG.png, "a.png", "image/png"))).toBe("photo");
    expect(mediaUploadKind(makeFile(SIG.mp4, "a.mp4", "video/mp4"))).toBe("video");
    expect(mediaUploadKind(makeFile(SIG.mp3, "a.mp3", "audio/mpeg"))).toBe("audio");
    expect(mediaUploadKind(makeFile(SIG.pdf, "cv.pdf", "application/pdf"))).toBe("document");
    expect(mediaUploadKind(makeFile(SIG.heic, "a.heic", ""))).toBe("photo");
    expect(() => mediaUploadKind(makeFile([1], "a.exe", "application/x-msdownload"))).toThrow(UploadValidationError);
  });

  it("allows_only_known_categories_and_slug_subtypes", () => {
    expect(parseMediaCategory(null)).toBe("general");
    expect(parseMediaCategory("site")).toBe("site");
    expect(() => parseMediaCategory("../x")).toThrow(UploadValidationError);
    expect(parseMediaSubType(null)).toBeUndefined();
    expect(parseMediaSubType("resume")).toBe("resume");
    expect(() => parseMediaSubType("../../secret")).toThrow(UploadValidationError);
    expect(() => parseMediaSubType("a".repeat(33))).toThrow(UploadValidationError);
  });
});

describe("assertContentLength", () => {
  it("rejects_declared_body_over_cap", () => {
    const over = new Headers({ "content-length": String(60 * MiB + 1) });
    expect(() => assertContentLength(over)).toThrow(UploadValidationError);
    expect(() => assertContentLength(new Headers({ "content-length": String(60 * MiB) }))).not.toThrow();
    expect(() => assertContentLength(new Headers())).not.toThrow();
  });
});
