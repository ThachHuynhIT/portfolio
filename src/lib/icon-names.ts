/**
 * icon-names.ts — pure icon name metadata (no React, no icon libraries).
 *
 * Each canonical name belongs to exactly one registry, so `Icon` can load only the
 * registry a name needs:
 * - public: fixed names rendered by the layout and public routes (synchronous, `icons/public.tsx`)
 * - music:  extra stroke icons used by the music lounge (lazy, `icons/music.tsx`)
 * - admin:  remaining stroke icons for admin/couple/tools (lazy, `icons/admin.tsx`)
 * - tech:   colored tech brand logos (lazy, `icons/brands.tsx`)
 * - social: monochrome social platform logos (lazy, `icons/social.tsx`)
 */

export const PUBLIC_ICON_NAMES = [
  "arrowLeft",
  "arrowRight",
  "aperture",
  "calendar",
  "camera",
  "check",
  "chevronLeft",
  "chevronRight",
  "close",
  "compare",
  "externalLink",
  "folder",
  "globe",
  "grid",
  "image",
  "mapPin",
  "masonry",
  "maximize",
  "music",
  "play",
  "rocket",
  "search",
  "sparkles",
  "star",
  "swap",
  "user",
  "video",
  "zap",
  "frontend",
  "backend",
  "tools",
  "design",
] as const;

export const MUSIC_ICON_NAMES = [
  "arrowDown",
  "arrowUp",
  "clock",
  "disc",
  "flame",
  "headphones",
  "heart",
  "heartCrack",
  "listMusic",
  "medal",
  "menu",
  "mic",
  "pause",
  "shuffle",
  "slider",
  "trophy",
] as const;

export const ADMIN_ICON_NAMES = [
  "dashboard",
  "settings",
  "skills",
  "projects",
  "blog",
  "links",
  "logout",
  "plus",
  "edit",
  "trash",
  "eye",
  "activity",
  "arrowUpDown",
  "cornerDownRight",
  "fileText",
  "brain",
  "mail",
  "users",
  "folderOpen",
  "bookOpen",
  "cake",
  "checkCircle",
  "xCircle",
  "alertTriangle",
  "refresh",
  "uploadCloud",
  "partyPopper",
  "gift",
  "loader",
  "copy",
  "table",
  "home",
] as const;

/** Icon names grouped for the admin icon-picker modal. */
export const TECH_BRAND_ICON_NAMES = [
  "react",
  "nextjs",
  "typescript",
  "javascript",
  "tailwind",
  "nodejs",
  "threejs",
  "prisma",
  "postgresql",
  "mongodb",
  "docker",
  "git",
  "figma",
  "cloudinary",
  "css",
  "vue",
  "angular",
  "redux",
  "graphql",
  "python",
  "aws",
  "java",
  "sass",
  "vite",
  "express",
] as const;

export const SOCIAL_BRAND_ICON_NAMES = [
  "github",
  "linkedin",
  "twitter",
  "facebook",
  "youtube",
  "instagram",
  "discord",
  "telegram",
] as const;

export type PublicIconName = (typeof PUBLIC_ICON_NAMES)[number];
export type MusicIconName = (typeof MUSIC_ICON_NAMES)[number];
export type AdminIconName = (typeof ADMIN_ICON_NAMES)[number];
export type TechBrandIconName = (typeof TECH_BRAND_ICON_NAMES)[number];
export type SocialBrandIconName = (typeof SOCIAL_BRAND_ICON_NAMES)[number];
export type CanonicalIconName =
  | PublicIconName
  | MusicIconName
  | AdminIconName
  | TechBrandIconName
  | SocialBrandIconName;

/** Extra names that render the same icon as their target. */
export const ICON_ALIASES = {
  nav: "menu",
} as const satisfies Record<string, CanonicalIconName>;

export type IconRegistry = "public" | "music" | "admin" | "tech" | "social";

const REGISTRY_BY_NAME: ReadonlyMap<string, IconRegistry> = new Map<string, IconRegistry>([
  ...PUBLIC_ICON_NAMES.map((n) => [n, "public"] as const),
  ...MUSIC_ICON_NAMES.map((n) => [n, "music"] as const),
  ...ADMIN_ICON_NAMES.map((n) => [n, "admin"] as const),
  ...TECH_BRAND_ICON_NAMES.map((n) => [n, "tech"] as const),
  ...SOCIAL_BRAND_ICON_NAMES.map((n) => [n, "social"] as const),
]);

const ALIASES: ReadonlyMap<string, CanonicalIconName> = new Map(Object.entries(ICON_ALIASES));

/** Canonical name for `name` (aliases resolved), or null when unknown/empty. */
export function resolveIconName(name: string | undefined | null): CanonicalIconName | null {
  if (!name) return null;
  const aliased = ALIASES.get(name);
  if (aliased) return aliased;
  return REGISTRY_BY_NAME.has(name) ? (name as CanonicalIconName) : null;
}

/** Which registry renders `name`, or null when unknown/empty. */
export function getIconRegistry(name: string | undefined | null): IconRegistry | null {
  const canonical = resolveIconName(name);
  return canonical ? (REGISTRY_BY_NAME.get(canonical) ?? null) : null;
}

/** True when `name` matches a registered icon (lucide stroke icon or brand logo). */
export function isKnownIconName(name: string | undefined | null): boolean {
  return resolveIconName(name) !== null;
}

/** True when `name` (after aliases) is rendered by the synchronous public registry. */
export function isPublicIconName(name: string | undefined | null): name is PublicIconName {
  return getIconRegistry(name) === "public" && resolveIconName(name) === name;
}
