/**
 * Icon.tsx — Centralized icon component
 *
 * Usage:
 *   <Icon name="settings" size={20} className="text-slate-400" />
 *   <Icon name="react" size={18} />
 *
 * Admin/UI icons: lucide-react (monochrome, stroke-based, simple & modern)
 * Tech brand icons: colored SVG paths (official brand colors — lucide has no logos)
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Heart,
  Settings,
  Award,
  Briefcase,
  Music2,
  Newspaper,
  Link2,
  Menu,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Check,
  Search,
  Star,
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowLeftRight,
  ArrowUpRight,
  Zap,
  Camera,
  Image as ImageIcon,
  Columns3,
  LayoutGrid,
  SplitSquareHorizontal,
  SlidersHorizontal,
  Aperture,
  Maximize2,
  X,
  Play,
  Pause,
  Video,
  Rocket,
  FileText,
  Brain,
  Mail,
  User,
  Users,
  Code2,
  Wrench,
  Palette,
  Server,
  Sparkles,
  Folder,
  FolderOpen,
  BookOpen,
  Cake,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  ExternalLink,
  CornerDownRight,
  RefreshCw,
  UploadCloud,
  Headphones,
  Flame,
  Medal,
  Trophy,
  Shuffle,
  Mic,
  Disc3,
  ListMusic,
  PartyPopper,
  Gift,
  Loader2,
  Copy,
  HeartCrack,
  Clock,
  Table,
  House,
} from "lucide-react";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  /** Fills the icon with the current text color — used for toggle states like a "liked" heart. */
  filled?: boolean;
}

// ─── Admin / UI Icons (lucide-react) ───────────────────────────────────────
const STROKE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  heart: Heart,
  settings: Settings,
  skills: Award,
  projects: Briefcase,
  music: Music2,
  blog: Newspaper,
  links: Link2,
  nav: Menu,
  globe: Globe,
  logout: LogOut,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  plus: Plus,
  edit: Pencil,
  trash: Trash2,
  eye: Eye,
  check: Check,
  search: Search,
  star: Star,
  activity: Activity,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  arrowUpDown: ArrowUpDown,
  swap: ArrowLeftRight,
  externalLink: ExternalLink,
  cornerDownRight: CornerDownRight,
  menu: Menu,
  zap: Zap,
  camera: Camera,
  image: ImageIcon,
  masonry: Columns3,
  grid: LayoutGrid,
  compare: SplitSquareHorizontal,
  slider: SlidersHorizontal,
  aperture: Aperture,
  maximize: Maximize2,
  close: X,
  play: Play,
  pause: Pause,
  video: Video,
  rocket: Rocket,
  fileText: FileText,
  brain: Brain,
  mail: Mail,
  user: User,
  users: Users,
  frontend: Code2,
  backend: Server,
  tools: Wrench,
  design: Palette,
  sparkles: Sparkles,
  folder: Folder,
  folderOpen: FolderOpen,
  bookOpen: BookOpen,
  cake: Cake,
  checkCircle: CheckCircle2,
  xCircle: XCircle,
  alertTriangle: AlertTriangle,
  mapPin: MapPin,
  calendar: Calendar,
  refresh: RefreshCw,
  uploadCloud: UploadCloud,
  headphones: Headphones,
  flame: Flame,
  medal: Medal,
  trophy: Trophy,
  shuffle: Shuffle,
  mic: Mic,
  disc: Disc3,
  listMusic: ListMusic,
  partyPopper: PartyPopper,
  gift: Gift,
  loader: Loader2,
  copy: Copy,
  heartCrack: HeartCrack,
  clock: Clock,
  table: Table,
  home: House,
};

// ─── Tech Brand Icons (colored fills, official SVG paths) ──────────────────
const BRAND_ICONS: Record<string, React.ReactNode> = {
  react: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.05" fill="#61DAFB" />
      <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61DAFB" strokeWidth="1.2" fill="none" />
      <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="3.8" stroke="#61DAFB" strokeWidth="1.2" fill="none" transform="rotate(120 12 12)" />
    </svg>
  ),
  nextjs: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z" />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 24 24">
      <rect x="0" y="0" width="24" height="24" rx="3" fill="#3178C6" />
      <path d="M13.5 11.5h3v1.5h-3v4h-1.5v-4h-3V11.5h3v-1h1.5v1z" fill="white" />
      <path d="M16 15.5c.3.4.8.7 1.4.7.5 0 .9-.2.9-.6 0-.4-.3-.6-1-.9-1.1-.4-1.8-.9-1.8-1.9 0-1 .8-1.8 2.1-1.8.7 0 1.3.2 1.8.6l-.6 1.1c-.3-.3-.7-.5-1.1-.5-.4 0-.7.2-.7.5 0 .4.3.5.9.8 1.2.4 1.9 1 1.9 2s-.8 1.8-2.3 1.8c-.9 0-1.6-.3-2.1-.8l.6-1z" fill="white" />
    </svg>
  ),
  javascript: (
    <svg viewBox="0 0 24 24">
      <rect x="0" y="0" width="24" height="24" rx="3" fill="#F7DF1E" />
      <path d="M6.5 17.5c.4.7 1 1.2 1.9 1.2.9 0 1.4-.5 1.4-1.1V12h1.7v5.7c0 1.8-1.1 2.6-2.7 2.6-1.4 0-2.3-.8-2.7-1.7L6.5 17.5zM14 17.3c.5.8 1.1 1.4 2.3 1.4 1 0 1.6-.5 1.6-1.2 0-.8-.6-1.1-1.7-1.6l-.6-.2c-1.7-.7-2.8-1.6-2.8-3.4 0-1.7 1.3-3 3.3-3 1.4 0 2.4.5 3.1 1.8l-1.5 1c-.4-.7-.9-1-1.6-1-.7 0-1.1.4-1.1 1 0 .7.4 1 1.5 1.4l.6.3c2 .9 3.1 1.7 3.1 3.6 0 2-1.6 3.1-3.7 3.1-2.1 0-3.4-1-4-2.4L14 17.3z" fill="black" />
    </svg>
  ),
  tailwind: (
    <svg viewBox="0 0 24 24" fill="#06B6D4">
      <path d="M12 6C9.33 6 7.67 7.33 7 10c1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35C13.27 10.8 14.33 12 16.5 12c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C15.23 7.2 14.17 6 12 6zm-4.5 6C4.83 12 3.17 13.33 2.5 16c1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35C8.77 16.8 9.83 18 12 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C10.73 13.2 9.67 12 7.5 12z" />
    </svg>
  ),
  nodejs: (
    <svg viewBox="0 0 24 24" fill="#339933">
      <path d="M12 1.85c-.27 0-.55.07-.78.2l-7.44 4.3c-.48.28-.78.8-.78 1.36v8.58c0 .56.3 1.08.78 1.36l7.44 4.3c.46.26 1.1.26 1.56 0l7.44-4.3c.48-.28.78-.8.78-1.36V7.71c0-.56-.3-1.08-.78-1.36l-7.44-4.3c-.23-.13-.51-.2-.78-.2zM12 4.85l5.5 3.18v6.31L12 17.5l-5.5-3.16V8.03L12 4.85z" />
    </svg>
  ),
  threejs: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.17 5.61L12 1.45l8.83 4.16-3.44 1.62-5.39-2.54-5.39 2.54L3.17 5.61zM12 20.55l-8.83-4.16.01-8.32 3.43 1.62-.01 5.08 5.4 2.54 5.4-2.54-.01-5.08 3.43-1.62.01 8.32L12 20.55z" />
    </svg>
  ),
  prisma: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.807 18.285L13.553.756a1.704 1.704 0 0 0-1.517-.955h-.072a1.704 1.704 0 0 0-1.555.955L2.193 18.285a1.698 1.698 0 0 0 .245 1.899l.05.054a1.698 1.698 0 0 0 1.3.462l7.207-1.21 7.208 1.21a1.706 1.706 0 0 0 1.35-.462l.05-.054a1.698 1.698 0 0 0 .204-1.899zM12.79 17.026l-5.738.963 5.738-13.588v12.625z" />
    </svg>
  ),
  postgresql: (
    <svg viewBox="0 0 24 24" fill="#336791">
      <path d="M17.128 0a10.134 10.134 0 0 0-2.755.403C13.28.728 12.394.829 12 .832c-.394-.003-1.28-.104-2.373-.429A10.135 10.135 0 0 0 6.872 0C3.437 0 1.006 2.798.18 6.6c-.473 2.157-.11 4.455.873 5.98.354.554.741.859 1.12.859.556 0 1.02-.517 1.394-1.535.322-.883.482-1.79.662-2.823.194-1.123.394-2.285.84-3.3.5-1.112 1.45-1.838 2.637-2.113a4.26 4.26 0 0 1 1.124-.137c.54 0 1.015.098 1.391.199.19.051.36.102.501.148.142-.046.312-.097.502-.148.376-.101.85-.2 1.391-.2.38 0 .76.046 1.124.138 1.187.275 2.137 1 2.637 2.112.446 1.016.646 2.178.84 3.301.18 1.033.34 1.94.662 2.823.374 1.018.838 1.535 1.394 1.535.38 0 .766-.305 1.12-.86.983-1.524 1.346-3.822.874-5.979C22.994 2.798 20.562 0 17.128 0z" />
    </svg>
  ),
  mongodb: (
    <svg viewBox="0 0 24 24" fill="#47A248">
      <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0 1 11.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 0 0 3.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z" />
    </svg>
  ),
  docker: (
    <svg viewBox="0 0 24 24" fill="#2496ED">
      <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.186.186 0 0 0-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" />
    </svg>
  ),
  git: (
    <svg viewBox="0 0 24 24" fill="#F05032">
      <path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.607-.404-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187" />
    </svg>
  ),
  figma: (
    <svg viewBox="0 0 24 24">
      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.026-4.49 4.515-4.49c2.489 0 4.515 2.014 4.515 4.49S10.661 24 8.172 24zm0-7.509c-1.665 0-3.044 1.355-3.044 3.019s1.379 3.019 3.044 3.019c1.665 0 3.044-1.355 3.044-3.019s-1.379-3.019-3.044-3.019zm7.704 0h-0.001c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.489 4.49zm0-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019z" fill="#F24E1E" />
    </svg>
  ),
  cloudinary: (
    <svg viewBox="0 0 24 24" fill="#3448C5">
      <path d="M19.84 9.94C19.43 7.17 17.02 5 14.13 5c-1.8 0-3.41.79-4.53 2.04A5.03 5.03 0 0 0 5 12.1C5 14.81 7.19 17 9.9 17h9.29C20.77 17 22 15.77 22 14.19c0-1.55-1.2-2.78-2.16-4.25z" />
    </svg>
  ),
  css: (
    <svg viewBox="0 0 24 24">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.413z" fill="#1572B6" />
    </svg>
  ),
};

// ─── Main Icon Component ───────────────────────────────────────────────────
export default function Icon({ name, size = 20, className = "", filled = false }: IconProps) {
  const LucideComp = STROKE_ICONS[name];
  if (LucideComp) {
    return <LucideComp size={size} className={className} fill={filled ? "currentColor" : "none"} />;
  }

  const brandIcon = BRAND_ICONS[name];
  if (brandIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {brandIcon}
      </span>
    );
  }

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
