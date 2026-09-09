import exifr from "exifr";

export interface ExtractedImageMetadata {
  title?: string;
  date?: string;
  aspectRatio?: "portrait" | "landscape" | "square";
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  software?: string;
}

/**
 * Format shutter speed decimal seconds to photography fraction (e.g. 0.004 -> 1/250s)
 */
function formatShutterSpeed(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  if (seconds >= 1) {
    const rounded = Math.round(seconds * 10) / 10;
    return `${rounded}s`;
  }
  const denominator = Math.round(1 / seconds);
  return `1/${denominator}s`;
}

/**
 * Clean camera make (e.g. NIKON CORPORATION -> Nikon)
 */
function cleanMake(make?: string): string {
  if (!make) return "";
  const trimmed = make.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes("sony")) return "Sony";
  if (lower.includes("canon")) return "Canon";
  if (lower.includes("nikon")) return "Nikon";
  if (lower.includes("fujifilm") || lower.includes("fuji")) return "Fujifilm";
  if (lower.includes("apple")) return "Apple";
  if (lower.includes("leica")) return "Leica";
  if (lower.includes("panasonic") || lower.includes("lumix")) return "Panasonic";
  if (lower.includes("olympus") || lower.includes("om digital")) return "OM System";
  if (lower.includes("ricoh")) return "Ricoh";
  return trimmed;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(rawDate?: Date | string | number): string {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Extract EXIF, camera, lens, and metadata from a File object
 */
export async function extractImageMetadata(file: File): Promise<ExtractedImageMetadata> {
  const result: ExtractedImageMetadata = {};

  try {
    const data = await exifr.parse(file, {
      tiff: true,
      xmp: true,
      exif: true,
      iptc: true,
      gps: true,
    });

    if (!data) return result;

    // 1. Camera Make & Model
    if (data.Make) {
      result.make = cleanMake(String(data.Make));
    }
    if (data.Model) {
      result.model = String(data.Model).trim();
    }

    // 2. Lens Model
    const lens = data.LensModel || data.Lens || data.LensInfo;
    if (lens) {
      result.lens = String(lens).trim();
    }

    // 3. Focal Length
    if (data.FocalLength) {
      const fl = Number(data.FocalLength);
      if (!isNaN(fl)) {
        result.focalLength = `${Math.round(fl)}mm`;
      }
    }

    // 4. Aperture / FNumber
    const fnum = data.FNumber || data.ApertureValue;
    if (fnum) {
      const fn = Number(fnum);
      if (!isNaN(fn)) {
        // e.g. f/1.8 or f/2.8
        result.aperture = `f/${Math.round(fn * 10) / 10}`;
      }
    }

    // 5. Shutter Speed / ExposureTime
    const exp = data.ExposureTime || data.ShutterSpeedValue;
    if (exp) {
      const expNum = Number(exp);
      if (!isNaN(expNum)) {
        result.shutterSpeed = formatShutterSpeed(expNum);
      }
    }

    // 6. ISO
    const iso = data.ISO || data.PhotographicSensitivity;
    if (iso) {
      result.iso = String(iso);
    }

    // 7. Date
    const rawDate = data.DateTimeOriginal || data.CreateDate || data.ModifyDate;
    if (rawDate) {
      result.date = formatDate(rawDate);
    }

    // 8. Software
    if (data.Software) {
      result.software = String(data.Software).trim();
    }

    // 9. Aspect Ratio based on width & height
    const width = data.ImageWidth || data.ExifImageWidth;
    const height = data.ImageHeight || data.ExifImageHeight;
    if (width && height) {
      const ratio = width / height;
      if (ratio > 1.15) {
        result.aspectRatio = "landscape";
      } else if (ratio < 0.88) {
        result.aspectRatio = "portrait";
      } else {
        result.aspectRatio = "square";
      }
    }

    // 10. Title / Document name if embedded
    const embeddedTitle = data.title || data.DocumentName || data.ObjectName;
    if (embeddedTitle && typeof embeddedTitle === "string" && embeddedTitle.trim()) {
      result.title = embeddedTitle.trim();
    }
  } catch (err) {
    console.warn("[extractImageMetadata] Error parsing EXIF:", err);
  }

  return result;
}
