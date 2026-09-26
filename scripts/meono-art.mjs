#!/usr/bin/env node
/**
 * Mèo Nổ card art: turn source images into the game's card images.
 *
 *   npm run art:meono               # reads art/meono/*
 *   npm run art:meono -- path/to/dir
 *
 * Two kinds of source file (prompts for both are in docs/MEONO_ART_PROMPTS.md):
 *   - `sheet1.png` … `sheet4.png`: one image holding a 4×3 grid of twelve cards, cut apart using SHEETS
 *     below (left to right, top row first);
 *   - `<type>.png` (`defuse.png`, `back.png`…): a single card. It wins over the same card from a
 *     sheet, so one bad card can be redone on its own.
 * Each card is cropped to 5:7, resized to 400×560 and saved as public/games/meono/cards/<type>.webp,
 * then src/lib/meono/art.ts is rewritten so the game knows which cards have art. Cards without
 * art keep the drawn face.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(process.argv[2] ?? join(ROOT, "art/meono"));
const OUT = join(ROOT, "public/games/meono/cards");
const MANIFEST = join(ROOT, "src/lib/meono/art.ts");
const W = 400;
const H = 560;
const EXTS = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

/** Cards in each sheet, left to right, top row first (4 columns × 3 rows); null = empty cell. */
const SHEETS = {
  1: ["exploding", "defuse", "attack", "skip", "favor", "shuffle", "future", "nope", "taco", "melon", "potato", "beard"],
  2: ["rainbow", "imploding", "reverse", "bottom", "feral", "alter", "targeted", "superskip", "swap", "catomic", "streaking", "future5"],
  3: ["garbage", "mark", "curse", "barking", "potluck", "ilt", "alternow", "bury", "personal", "share", "slap", "annoy"],
  4: ["zombie", "feed", "dig", "clone", "grave", "deadattack", "clairvoyance", "steal", "rollcall", "corn", "back", null],
};
const COLS = 4;
const ROWS = 3;

// Card types, read from the CARDS table so this never drifts from the game.
const cardsTs = readFileSync(join(ROOT, "src/lib/meono/cards.ts"), "utf8");
const table = cardsTs.slice(cardsTs.indexOf("export const CARDS"));
const TYPES = new Set([...table.matchAll(/^ {2}([a-z0-9]+): \{/gm)].map((m) => m[1]));
TYPES.add("back");

if (!existsSync(SRC)) {
  console.error(`Không thấy thư mục ảnh nguồn: ${SRC}`);
  process.exit(1);
}

for (const [n, cards] of Object.entries(SHEETS)) {
  for (const t of cards) if (t && !TYPES.has(t)) throw new Error(`SHEETS[${n}]: không có lá "${t}"`);
}

const save = (img, type) =>
  img
    .resize(W, H, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 82, effort: 6 })
    .toFile(join(OUT, `${type}.webp`));

/** Trim a plain border of colour `bg` (if any) off an image; unchanged when there is none. */
async function trimBg(buf, bg) {
  try {
    return await sharp(buf).trim({ background: bg, threshold: 30 }).toBuffer();
  } catch {
    return buf;
  }
}

/**
 * Cut a 4×3 sheet into its cards: trim the plain outer margin, split evenly, then (when the sheet
 * has such a margin) trim that gutter colour off each cell, and shave a little more for safety.
 */
async function cutSheet(file, cards) {
  const src = await sharp(file).rotate().toBuffer();
  const { data: corner } = await sharp(src).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = { r: corner[0], g: corner[1], b: corner[2] };
  const sheet = await trimBg(src, bg);
  const { width, height } = await sharp(sheet).metadata();
  // No plain outer margin → the corner is part of a picture, not the gutter colour: don't trim by it.
  const full = await sharp(src).metadata();
  const gutters = width < full.width - 4 || height < full.height - 4;
  const cw = Math.floor(width / COLS);
  const ch = Math.floor(height / ROWS);
  const out = [];
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i]) continue;
    const region = { left: (i % COLS) * cw, top: Math.floor(i / COLS) * ch, width: cw, height: ch };
    const raw = await sharp(sheet).extract(region).toBuffer();
    const cell = gutters ? await trimBg(raw, bg) : raw;
    const m = await sharp(cell).metadata();
    const pad = Math.round(Math.min(m.width, m.height) * 0.02);
    await save(sharp(cell).extract({ left: pad, top: pad, width: m.width - 2 * pad, height: m.height - 2 * pad }), cards[i]);
    out.push(cards[i]);
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC)
  .filter((f) => EXTS.includes(extname(f).toLowerCase()))
  .sort();
const done = [];
const unknown = [];
// Sheets first, so single-card files can replace a card from a sheet.
for (const file of files) {
  const m = /^sheet(\d+)$/i.exec(basename(file, extname(file)));
  if (!m) continue;
  if (!SHEETS[m[1]]) {
    unknown.push(file);
    continue;
  }
  const cards = await cutSheet(join(SRC, file), SHEETS[m[1]]);
  console.log(`${file} → ${cards.join(", ")}`);
  done.push(...cards);
}
for (const file of files) {
  const type = basename(file, extname(file)).toLowerCase();
  if (/^sheet\d+$/.test(type)) continue;
  if (!TYPES.has(type)) {
    unknown.push(file);
    continue;
  }
  await save(sharp(join(SRC, file)).rotate(), type);
  if (!done.includes(type)) done.push(type);
}

// The manifest lists every image in the output folder, not just this run's.
const have = readdirSync(OUT)
  .filter((f) => f.endsWith(".webp") && TYPES.has(basename(f, ".webp")))
  .map((f) => basename(f, ".webp"))
  .sort();
const hash = createHash("sha1");
for (const t of have) hash.update(t).update(readFileSync(join(OUT, `${t}.webp`)));
const version = have.length ? hash.digest("hex").slice(0, 8) : "0";

writeFileSync(
  MANIFEST,
  `// Generated by scripts/meono-art.mjs — do not edit by hand.
import type { CardType } from "./cards";

/**
 * Card types that have artwork in public/games/meono/cards/<type>.webp ("back" = the card back).
 * Everything else keeps the drawn face (colour + emoji), so art can be added a few cards at a time.
 */
export const MEO_ART: readonly (CardType | "back")[] = [${have.map((t) => JSON.stringify(t)).join(", ")}];

/** Changes whenever the images change, so browsers don't keep old ones. */
export const MEO_ART_VERSION = ${JSON.stringify(version)};
`,
);

const missing = [...TYPES].filter((t) => !have.includes(t)).sort();
console.log(`Đã chuyển ${done.length} ảnh${done.length ? `: ${done.join(", ")}` : ""}.`);
if (unknown.length) console.log(`Bỏ qua (tên không khớp loại lá nào): ${unknown.join(", ")}`);
console.log(`Có ảnh: ${have.length}/${TYPES.size}.${missing.length ? ` Còn thiếu: ${missing.join(", ")}` : ""}`);
