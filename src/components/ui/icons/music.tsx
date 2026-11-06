/** Lazy registry: extra stroke icons used by the music lounge. Loaded on demand by `Icon`. */
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Disc3,
  Flame,
  Headphones,
  Heart,
  HeartCrack,
  ListMusic,
  Medal,
  Menu,
  Mic,
  Pause,
  Shuffle,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";
import type { MusicIconName } from "@/lib/icon-names";
import type { StrokeIconProps } from "./frames";

const MUSIC_ICONS: Record<MusicIconName, LucideIcon> = {
  arrowDown: ArrowDown,
  arrowUp: ArrowUp,
  clock: Clock,
  disc: Disc3,
  flame: Flame,
  headphones: Headphones,
  heart: Heart,
  heartCrack: HeartCrack,
  listMusic: ListMusic,
  medal: Medal,
  menu: Menu,
  mic: Mic,
  pause: Pause,
  shuffle: Shuffle,
  slider: SlidersHorizontal,
  trophy: Trophy,
};

export default function MusicIcon({ name, size, className, filled }: StrokeIconProps<MusicIconName>) {
  const Comp = MUSIC_ICONS[name];
  return <Comp size={size} className={className} fill={filled ? "currentColor" : "none"} />;
}
