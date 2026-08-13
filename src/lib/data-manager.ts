import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "content/data");

/**
 * Ensure the data directory exists.
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Read a JSON data file from content/data/.
 * Returns the parsed data or the provided fallback if the file doesn't exist.
 */
export function readJsonFile<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[data-manager] Error reading ${filename}:`, error);
    return fallback;
  }
}

/**
 * Write data to a JSON file in content/data/.
 * Uses write-to-temp-then-rename for atomicity.
 */
export function writeJsonFile<T>(filename: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + ".tmp";
  try {
    const json = JSON.stringify(data, null, 2) + "\n";
    fs.writeFileSync(tmpPath, json, "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    // Clean up temp file on failure
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Generate a simple unique ID with a given prefix.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
