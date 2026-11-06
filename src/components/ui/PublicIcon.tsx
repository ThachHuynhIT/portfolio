/**
 * PublicIcon.tsx — synchronous icon for fixed names on public pages.
 *
 * Only the small public lucide set (`icons/public.tsx`) is bundled; no hooks, no lazy
 * loading, usable from server and client components. For CMS-driven or admin/music
 * names use `Icon`, which loads the other registries on demand.
 *
 *   <PublicIcon name="arrowRight" size={14} />
 */
import type { PublicIconName } from "@/lib/icon-names";
import { PUBLIC_ICONS } from "./icons/public";

export interface PublicIconProps {
  name: PublicIconName;
  size?: number;
  className?: string;
  /** Fills the icon with the current text color — used for toggle states like a "liked" heart. */
  filled?: boolean;
}

export default function PublicIcon({ name, size = 20, className = "", filled = false }: PublicIconProps) {
  const LucideComp = PUBLIC_ICONS[name];
  return <LucideComp size={size} className={className} fill={filled ? "currentColor" : "none"} />;
}
