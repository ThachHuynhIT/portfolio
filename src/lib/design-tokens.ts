/**
 * DESIGN TOKENS — single source of truth for colors & sizes shared by many
 * components.
 *
 * Why this file exists: values such as `border-white/10`, `bg-white/5`,
 * `rounded-xl`, `from-purple-500 to-cyan-500` or `duration-300` were repeated
 * across ~97 component files. Changing the look meant editing every file.
 * Import a token from here instead, and one edit updates the whole site.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * HOW TO USE
 *
 *   import { cn } from "@/lib/utils";
 *   import { surface, border, text, radius, motion } from "@/lib/design-tokens";
 *
 *   <div className={cn(surface.card, border.subtle, radius.card, motion.base)}>
 *
 * Prefer the ready-made recipes in `@/lib/ui-presets` when one fits — they are
 * built out of the tokens below.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * TWO KINDS OF TOKENS
 *
 * 1. `palette` — raw hex/rgba values, for canvas / WebGL / inline styles.
 *    These MIRROR the CSS custom properties in `src/app/globals.css`. If you
 *    change one, change the other (CSS vars can't be imported into TS).
 * 2. Everything else — Tailwind class strings. Dark is the default look; each
 *    token already bundles its `light:` variant per the convention documented
 *    in CLAUDE.md §5, so you never write the light variant by hand.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * NOTE ON EXCLUDED ROUTES
 *
 * `/admin`, `/contra`, `/couple`, `/music` (EXCLUDED_ROUTE_PREFIXES in
 * `constants.ts`) are dark-only. Inside those subtrees use the `*Dark` tokens,
 * which carry no `light:` variant.
 */

/* ========================================================================== */
/* 1. RAW PALETTE (hex / rgba)                                                */
/*    Mirrors the CSS variables in globals.css — keep both in sync.           */
/* ========================================================================== */

export const palette = {
  /** Page background — dark theme (globals.css `--background`) */
  backgroundDark: "#050505",
  /** Page background — light theme */
  backgroundLight: "#faf9fc",
  /** Body text — dark theme (globals.css `--foreground`) */
  foregroundDark: "#fafafa",
  /** Body text — light theme */
  foregroundLight: "#0a0a0f",

  /** Primary brand accent (purple-500) — gradients, glows, focus rings */
  purple: "#8b5cf6",
  /** Primary brand accent, pressed/hover (purple-600) */
  purpleDeep: "#7c3aed",
  /** Secondary brand accent (cyan-500) — gradient end stop */
  cyan: "#06b6d4",
  /** Secondary brand accent, pressed/hover (cyan-600) */
  cyanDeep: "#0891b2",

  /** Glass surface fill / hairline — dark theme */
  glassBgDark: "rgba(255, 255, 255, 0.05)",
  glassBorderDark: "rgba(255, 255, 255, 0.1)",
  /** Glass surface fill / hairline — light theme */
  glassBgLight: "rgba(10, 10, 20, 0.04)",
  glassBorderLight: "rgba(10, 10, 20, 0.1)",

  /** Glow colors used by `.glow-purple` / `.glow-cyan` */
  glowPurple: "rgba(139, 92, 246, 0.4)",
  glowCyan: "rgba(6, 182, 212, 0.4)",
} as const;

/* ========================================================================== */
/* 2. BRAND — the purple → cyan signature gradient                            */
/* ========================================================================== */

export const brand = {
  /** The site's signature gradient. Used 39x across components. */
  gradient: "bg-gradient-to-r from-purple-500 to-cyan-500",
  /** Same gradient, hover/pressed step darker. */
  gradientHover: "hover:from-purple-600 hover:to-cyan-600",
  /** Diagonal variant for large surfaces / cards. */
  gradientDiagonal: "bg-gradient-to-br from-purple-500 to-cyan-500",
  /** Faint tinted wash behind sections and hero blobs. */
  gradientWash: "bg-gradient-to-br from-purple-500/20 to-cyan-500/20",
  /** Barely-there wash for card backdrops. */
  gradientWashFaint: "bg-gradient-to-br from-purple-500/10 to-cyan-500/10",
  /** Gradient clipped to text. Pairs with the `.gradient-text` CSS utility. */
  gradientText:
    "bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent",

  /** Solid accent colors when a gradient is too loud. */
  accent: "text-purple-400",
  accentAlt: "text-cyan-400",
  accentBg: "bg-purple-500",
  accentBgSubtle: "bg-purple-500/10",
  accentBorder: "border-purple-500/30",

  /** Purple glow shadow for primary CTAs. */
  glow: "shadow-lg shadow-purple-500/25",
  glowHover: "hover:shadow-purple-500/40",
} as const;

/* ========================================================================== */
/* 3. SURFACES — background fills, lightest → most opaque                     */
/* ========================================================================== */

export const surface = {
  /** Barely visible tint, e.g. table rows, nested panels. (`bg-white/[0.02]`) */
  faint: "bg-white/[0.02] light:bg-neutral-900/[0.02]",
  /** Default card / input fill. Most used surface on the site. (`bg-white/5`) */
  card: "bg-white/5 light:bg-neutral-900/[0.04]",
  /** Slightly raised: hovered card, active tab, chip. (`bg-white/10`) */
  raised: "bg-white/10 light:bg-neutral-900/[0.06]",
  /** Strongest fill: selected state, solid chip. (`bg-white/20`) */
  strong: "bg-white/20 light:bg-neutral-900/10",

  /** Hover steps, to pair with the fills above. */
  faintHover: "hover:bg-white/5 light:hover:bg-neutral-900/[0.04]",
  cardHover: "hover:bg-white/10 light:hover:bg-neutral-900/[0.06]",
  raisedHover: "hover:bg-white/20 light:hover:bg-neutral-900/10",

  /** Page / modal chrome that sits over content (nav bars, sheet headers). */
  chrome: "bg-black/60 light:bg-white/80",
  /** Full-screen modal scrim. */
  scrim: "bg-black/80 light:bg-neutral-900/40",

  /** Dark-only fills for /admin, /contra, /couple, /music. */
  cardDark: "bg-white/5",
  raisedDark: "bg-white/10",
  /** Admin form field background. */
  inputDark: "bg-slate-950",
  /** Admin panel background. */
  panelDark: "bg-slate-900/60",
} as const;

/* ========================================================================== */
/* 4. BORDERS — hairlines, lightest → strongest                               */
/* ========================================================================== */

export const border = {
  /** Faintest divider, e.g. inside a card. (`border-white/5`) */
  faint: "border border-white/5 light:border-neutral-900/5",
  /** THE default border. Used 267x. (`border-white/10`) */
  subtle: "border border-white/10 light:border-neutral-900/10",
  /** Hovered / focused card edge. (`border-white/20`) */
  strong: "border border-white/20 light:border-neutral-900/15",

  /** Hover steps, to pair with the borders above. */
  subtleHover: "hover:border-white/20 light:hover:border-neutral-900/15",
  strongHover: "hover:border-white/40 light:hover:border-neutral-900/30",

  /** Single-edge dividers (section separators, list rows). */
  dividerTop: "border-t border-white/10 light:border-neutral-900/10",
  dividerBottom: "border-b border-white/10 light:border-neutral-900/10",

  /** Dark-only borders for excluded routes. */
  subtleDark: "border border-white/10",
  strongDark: "border border-white/20",
} as const;

/* ========================================================================== */
/* 5. TEXT — by emphasis, strongest → faintest                                */
/* ========================================================================== */

export const text = {
  /** Headings and primary copy. (`text-white`) */
  primary: "text-white light:text-neutral-900",
  /** Body copy, secondary labels. (`text-white/80`) */
  secondary: "text-white/80 light:text-neutral-800",
  /** Supporting text, captions, meta. (`text-white/60`) */
  muted: "text-white/60 light:text-neutral-600",
  /** De-emphasized: timestamps, placeholders, disabled. (`text-white/40`) */
  subtle: "text-white/40 light:text-neutral-500",

  /** Hover step for interactive muted text. */
  mutedHover: "hover:text-white light:hover:text-neutral-900",

  /** Dark-only text for excluded routes. */
  primaryDark: "text-white",
  mutedDark: "text-white/60",
  subtleDark: "text-white/40",
} as const;

/* ========================================================================== */
/* 6. STATUS — success / warning / danger / info                              */
/*    Each entry: `fg` text, `bg` tinted fill, `border` edge, `solid` chip.    */
/* ========================================================================== */

export const status = {
  success: {
    fg: "text-emerald-400 light:text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border border-emerald-500/30",
    solid: "bg-emerald-500 text-white",
  },
  warning: {
    fg: "text-amber-400 light:text-amber-600",
    bg: "bg-amber-500/10",
    border: "border border-amber-500/30",
    solid: "bg-amber-500 text-neutral-900",
  },
  danger: {
    fg: "text-red-400 light:text-red-600",
    bg: "bg-red-500/10",
    border: "border border-red-500/30",
    solid: "bg-red-500 text-white",
  },
  info: {
    fg: "text-cyan-400 light:text-cyan-600",
    bg: "bg-cyan-500/10",
    border: "border border-cyan-500/30",
    solid: "bg-cyan-500 text-white",
  },
} as const;

/* ========================================================================== */
/* 7. RADIUS — named by role, not by size                                     */
/*    Change `card` here and every card on the site follows.                  */
/* ========================================================================== */

export const radius = {
  /** Tags, badges, small chips. */
  chip: "rounded-lg",
  /** Buttons, inputs, list rows — the default. Used 334x. */
  control: "rounded-xl",
  /** Cards, panels, tiles. Used 105x. */
  card: "rounded-2xl",
  /** Modals, hero panels, large feature blocks. */
  panel: "rounded-3xl",
  /** Pills, avatars, icon buttons. Used 252x. */
  pill: "rounded-full",
} as const;

/* ========================================================================== */
/* 8. LAYOUT — page shell, section rhythm, gaps                               */
/* ========================================================================== */

export const layout = {
  /** Standard page container: centered, max width, responsive gutters. */
  container: "container mx-auto px-4 sm:px-6 max-w-7xl",
  /** Narrower container for prose (blog posts, legal text). */
  containerProse: "container mx-auto px-4 sm:px-6 max-w-3xl",
  /** Vertical rhythm for a homepage section (see ARCHITECTURE.md). */
  sectionPadding: "pt-8 pb-60",
  /** Slightly tighter section (projects, skills). */
  sectionPaddingTight: "pt-8 pb-56",
  /** Standalone page section (blog index, photography). */
  sectionPaddingPage: "py-20",
  /** Full section wrapper: positioning + overflow guard + rhythm. */
  section: "relative pt-8 pb-60 overflow-hidden",
} as const;

export const gap = {
  /** Icon ↔ label inside a button or chip. Used 218x. */
  tight: "gap-2",
  /** Items in a toolbar or inline list. */
  base: "gap-3",
  /** Form fields, card internals. */
  loose: "gap-4",
  /** Grid of cards. */
  grid: "gap-6",
} as const;

/* ========================================================================== */
/* 9. SIZES — icons and avatars                                               */
/* ========================================================================== */

export const iconSize = {
  /** Inline with text (chevrons, small meta icons). Used 26x. */
  xs: "w-4 h-4",
  /** Default button / nav icon. */
  sm: "w-5 h-5",
  /** Standalone icon, card header. */
  md: "w-6 h-6",
  /** Icon button hit area. */
  button: "w-9 h-9",
  /** Feature tile / skill icon. Used 17x. */
  lg: "w-12 h-12",
  /** Avatar / profile thumbnail. */
  avatar: "w-24 h-24",
} as const;

/* ========================================================================== */
/* 10. MOTION — durations & transitions                                       */
/*     Framer Motion variants live in `@/lib/animations.ts`.                   */
/* ========================================================================== */

export const motion = {
  /** Snappy: color and opacity swaps on hover. */
  fast: "transition-all duration-200",
  /** THE default transition. Used 33x. */
  base: "transition-all duration-300",
  /** Deliberate: layout shifts, expanding panels. */
  slow: "transition-all duration-500",
  /** Color-only, avoids animating layout properties. */
  colors: "transition-colors duration-200",
  /** Standard press feedback on interactive elements. */
  press: "active:scale-95",
} as const;

/* ========================================================================== */
/* 11. ELEVATION — blur & shadow                                              */
/* ========================================================================== */

export const elevation = {
  /** Glass blur for nav bars and sticky chrome. Used 54x. */
  blur: "backdrop-blur-md",
  /** Heavier blur for cards and modals. */
  blurStrong: "backdrop-blur-xl",
  /** Resting card shadow. */
  card: "shadow-xl shadow-black/10 light:shadow-neutral-400/10",
  /** Lifted card on hover. */
  cardHover: "hover:shadow-2xl hover:shadow-purple-500/5",
  /** Modal / popover. */
  modal: "shadow-2xl shadow-black/40",
} as const;

/* ========================================================================== */
/* 12. Z-INDEX — one ladder, so layers never fight                            */
/*     Use these instead of inventing `z-[9999]`.                             */
/* ========================================================================== */

export const zIndex = {
  /** Content above a decorative background layer. */
  base: "z-10",
  /** Sticky sub-headers, floating action buttons. */
  sticky: "z-30",
  /** Site navigation bar. */
  nav: "z-40",
  /** Modal backdrop + dialog. */
  modal: "z-50",
  /** Toasts and the photo lightbox — above everything. */
  overlay: "z-[60]",
} as const;

/* ========================================================================== */
/* 13. FOCUS — accessibility ring, identical everywhere                       */
/* ========================================================================== */

export const focus = {
  /** Keyboard focus ring for buttons and links. */
  ring:
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-black " +
    "light:focus-visible:ring-offset-white",
  /** Focus treatment for text inputs (border tint, no ring). */
  input: "focus:outline-none focus:border-purple-500",
  /** Disabled state, paired with any interactive element. */
  disabled: "disabled:cursor-not-allowed disabled:opacity-50",
} as const;

/* ========================================================================== */
/* 14. TYPE SCALE — headings used across sections                             */
/* ========================================================================== */

export const heading = {
  /** Hero headline. */
  hero: "text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight",
  /** Section title. Used 4x verbatim across sections. */
  section: "text-4xl md:text-5xl font-bold",
  /** Card / panel title. */
  card: "text-2xl font-bold",
  /** Small eyebrow label above a title. */
  eyebrow: "text-sm font-medium uppercase tracking-widest",
} as const;
