/**
 * Fixed 4-slot stat definitions for the About section, in the order the
 * homepage renders them. The stat *values* ("3+", "9+", ...) have no home in
 * the locale files — they're literal fallbacks baked into the component —
 * so this is the single source of truth both AboutSection.tsx and the admin
 * defaults below read from, keeping them from drifting apart.
 */
export const ABOUT_STAT_DEFS = [
  { key: "years", fallbackValue: "3+" },
  { key: "projects", fallbackValue: "3+" },
  { key: "clients", fallbackValue: "3+" },
  { key: "tech", fallbackValue: "9+" },
] as const;
