"use client";

/**
 * Icon.tsx — compatibility icon component for any known name (CMS, admin, music).
 *
 * Usage:
 *   <Icon name="settings" size={20} className="text-slate-400" />
 *   <Icon name="react" size={18} />
 *
 * Names are classified by `src/lib/icon-names.ts`:
 * - public names render synchronously through `PublicIcon` (small lucide set);
 * - music/admin stroke icons and tech/social brand logos live in separate registries
 *   under `./icons/` that are code-split and loaded only when such a name renders.
 *   While a registry chunk loads, a same-size empty slot keeps the layout stable; on
 *   server-rendered pages the SSR markup stays in place until hydration finishes.
 * For fixed public names prefer importing `PublicIcon` directly.
 */

import { Suspense, lazy } from "react";
import {
  getIconRegistry,
  resolveIconName,
  type AdminIconName,
  type MusicIconName,
  type PublicIconName,
  type SocialBrandIconName,
  type TechBrandIconName,
} from "@/lib/icon-names";
import PublicIcon from "./PublicIcon";
import { BrandIconFrame, StrokeIconSlot } from "./icons/frames";

export {
  isKnownIconName,
  TECH_BRAND_ICON_NAMES,
  SOCIAL_BRAND_ICON_NAMES,
} from "@/lib/icon-names";

const MusicIcon = lazy(() => import("./icons/music"));
const AdminIcon = lazy(() => import("./icons/admin"));
const TechBrandIcon = lazy(() => import("./icons/brands"));
const SocialBrandIcon = lazy(() => import("./icons/social"));

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  /** Fills the icon with the current text color — used for toggle states like a "liked" heart. */
  filled?: boolean;
}

// ─── Main Icon Component ───────────────────────────────────────────────────
export default function Icon({ name, size = 20, className = "", filled = false }: IconProps) {
  const canonical = resolveIconName(name);

  switch (getIconRegistry(canonical)) {
    case "public":
      return (
        <PublicIcon name={canonical as PublicIconName} size={size} className={className} filled={filled} />
      );
    case "music":
      return (
        <Suspense fallback={<StrokeIconSlot size={size} className={className} />}>
          <MusicIcon name={canonical as MusicIconName} size={size} className={className} filled={filled} />
        </Suspense>
      );
    case "admin":
      return (
        <Suspense fallback={<StrokeIconSlot size={size} className={className} />}>
          <AdminIcon name={canonical as AdminIconName} size={size} className={className} filled={filled} />
        </Suspense>
      );
    case "tech":
      return (
        <Suspense fallback={<BrandIconFrame size={size} className={className} />}>
          <TechBrandIcon name={canonical as TechBrandIconName} size={size} className={className} />
        </Suspense>
      );
    case "social":
      return (
        <Suspense fallback={<BrandIconFrame size={size} className={className} />}>
          <SocialBrandIcon name={canonical as SocialBrandIconName} size={size} className={className} />
        </Suspense>
      );
    default:
      // Fallback — render a generic square placeholder
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          className={className}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
}
