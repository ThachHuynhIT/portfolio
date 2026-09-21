/**
 * UI PRESETS — ready-made class strings for patterns repeated across files.
 *
 * Tokens in `@/lib/design-tokens` are the vocabulary (one color, one size);
 * this file is the sentences (a whole card, a whole input). If the same long
 * `className` appears in three or more components, it belongs here.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * USAGE
 *
 *   import { cn } from "@/lib/utils";
 *   import { presets } from "@/lib/ui-presets";
 *
 *   <input className={cn(presets.input, "font-mono")} />
 *   <span className={presets.badge.success}>Published</span>
 *
 * `cn()` (clsx + tailwind-merge) resolves conflicts, so any class you append
 * wins over the preset — override freely instead of forking a preset.
 *
 * Presets suffixed `Dark` are for the dark-only routes in
 * EXCLUDED_ROUTE_PREFIXES (`/admin`, `/contra`, `/couple`, `/music`) and
 * deliberately carry no `light:` variants.
 */

import {
  border,
  brand,
  elevation,
  focus,
  gap,
  iconSize,
  layout,
  motion,
  radius,
  status,
  surface,
  text,
} from "./design-tokens";

const join = (...parts: string[]) => parts.join(" ");

export const presets = {
  /* ---------------------------------------------------------------------- */
  /* Surfaces                                                               */
  /* ---------------------------------------------------------------------- */

  /** Glassmorphism card. Matches `<GlassCard />`; use the component when you can. */
  card: join(
    "relative",
    radius.card,
    border.subtle,
    surface.card,
    elevation.blurStrong,
    "p-6",
    elevation.card
  ),

  /** Card that lifts and brightens on hover — for clickable tiles. */
  cardInteractive: join(
    "relative",
    radius.card,
    border.subtle,
    surface.card,
    elevation.blurStrong,
    "p-6",
    elevation.card,
    motion.base,
    border.subtleHover,
    surface.cardHover,
    elevation.cardHover
  ),

  /** Flat panel without blur — for dense lists and admin tables. */
  panel: join(radius.control, border.subtle, surface.faint, "p-4"),

  /** Sticky top chrome (nav bars, sheet headers). */
  chrome: join(surface.chrome, elevation.blur, border.dividerBottom),

  /* ---------------------------------------------------------------------- */
  /* Form controls                                                          */
  /* ---------------------------------------------------------------------- */

  /** Text input / select / textarea on the public site. */
  input: join(
    "w-full px-4 py-2.5 text-sm",
    radius.control,
    surface.card,
    border.subtle,
    text.primary,
    "placeholder:text-white/40 light:placeholder:text-neutral-500",
    focus.input,
    motion.colors
  ),

  /** Compact input for toolbars and inline edits. */
  inputCompact: join(
    "w-full px-3 py-1.5 text-xs",
    radius.chip,
    surface.card,
    border.subtle,
    text.primary,
    focus.input,
    motion.colors
  ),

  /** Admin CMS input — dark-only, matches the slate-950 form chrome. */
  inputDark: join(
    "w-full px-4 py-2.5 text-sm",
    surface.inputDark,
    border.subtleDark,
    radius.control,
    text.primaryDark,
    focus.input,
    motion.colors
  ),

  /** Field label above an input. */
  label: join("block mb-1.5 text-sm font-medium", text.secondary),

  /** Inline validation error under a field. */
  errorText: join("mt-1.5 text-xs", status.danger.fg),

  /* ---------------------------------------------------------------------- */
  /* Buttons — prefer `<Button />`; these are for anchors and custom markup  */
  /* ---------------------------------------------------------------------- */

  /** Primary CTA: brand gradient, glow, press feedback. */
  buttonPrimary: join(
    "inline-flex items-center justify-center",
    gap.tight,
    "px-6 py-3 text-base font-medium",
    radius.control,
    brand.gradient,
    "text-white",
    brand.gradientHover,
    brand.glow,
    brand.glowHover,
    motion.base,
    motion.press,
    focus.ring,
    focus.disabled
  ),

  /** Secondary button: tinted surface, hairline border. */
  buttonSecondary: join(
    "inline-flex items-center justify-center",
    gap.tight,
    "px-6 py-3 text-base font-medium",
    radius.control,
    surface.raised,
    text.primary,
    surface.raisedHover,
    border.subtle,
    elevation.blur,
    motion.base,
    focus.ring,
    focus.disabled
  ),

  /** Square icon-only button. */
  buttonIcon: join(
    "inline-flex items-center justify-center",
    iconSize.button,
    radius.chip,
    surface.card,
    border.subtle,
    text.muted,
    text.mutedHover,
    surface.cardHover,
    motion.base,
    focus.ring
  ),

  /* ---------------------------------------------------------------------- */
  /* Badges & chips                                                         */
  /* ---------------------------------------------------------------------- */

  /** Neutral tag / meta pill. */
  chip: join(
    "inline-flex items-center",
    gap.tight,
    "px-2.5 py-1 text-xs font-medium",
    radius.pill,
    surface.card,
    border.subtle,
    text.muted
  ),

  /** Clickable filter chip (tags, categories). */
  chipInteractive: join(
    "inline-flex items-center",
    gap.tight,
    "px-2.5 py-1 text-xs font-medium cursor-pointer",
    radius.pill,
    surface.card,
    border.subtle,
    text.muted,
    surface.cardHover,
    text.mutedHover,
    motion.base
  ),

  /** Status badges — `presets.badge.success`, `.warning`, `.danger`, `.info`. */
  badge: {
    success: join(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
      radius.pill,
      status.success.bg,
      status.success.border,
      status.success.fg
    ),
    warning: join(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
      radius.pill,
      status.warning.bg,
      status.warning.border,
      status.warning.fg
    ),
    danger: join(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
      radius.pill,
      status.danger.bg,
      status.danger.border,
      status.danger.fg
    ),
    info: join(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold",
      radius.pill,
      status.info.bg,
      status.info.border,
      status.info.fg
    ),
  },

  /* ---------------------------------------------------------------------- */
  /* Page structure                                                         */
  /* ---------------------------------------------------------------------- */

  /** Homepage section wrapper — positioning, overflow guard, vertical rhythm. */
  section: layout.section,

  /** Centered content container inside a section. */
  container: layout.container,

  /** Section title with the brand gradient clipped to the text. */
  sectionTitle: join(
    "text-4xl md:text-5xl font-bold tracking-tight",
    brand.gradientText
  ),

  /** Lead paragraph under a section title. */
  sectionSubtitle: join("text-base md:text-lg max-w-2xl", text.muted),

  /** Hairline divider between list rows. */
  divider: border.dividerTop,
} as const;

export type PresetName = keyof typeof presets;
